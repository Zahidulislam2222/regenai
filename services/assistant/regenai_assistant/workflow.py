"""Policy gates and approval-bound support state transitions."""

import json
import secrets
import time
from typing import Any

from .ai import AI
from .config import content
from .models import Recommendation, Rulebook, TicketInput
from .store import Conflict, Store


class Workflow:
    def __init__(self, store: Store, ai: AI):
        self.store = store
        self.ai = ai
        self.demo = content("demo.json")

    def seed(self, scope: str) -> None:
        if self.store.get(scope, "rulebook", "active"):
            return
        self.store.put(
            scope, "rulebook", "active", Rulebook.model_validate(self.demo["rulebook"]).model_dump()
        )
        for order in self.demo["orders"]:
            self.store.put(scope, "order", order["id"], order)
        for ticket in self.demo["tickets"]:
            self.store.put(
                scope, "ticket", ticket["id"], {**ticket, "state": "new", "synthetic": True}
            )
        self.store.audit(scope, "workspace_created", {"synthetic": True})

    def rulebook(self, scope: str) -> dict:
        result = self.store.get(scope, "rulebook", "active")
        if result is None:
            raise ValueError("Store rulebook has not been configured")
        return result

    def save_rulebook(self, scope: str, rulebook: Rulebook, version: int) -> dict:
        with self.store.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT * FROM records WHERE scope=? AND kind='rulebook' AND id='active'", (scope,)
            ).fetchone()
            if row is None or row["version"] != version:
                raise Conflict("Policy changed; reload before saving")
            self.store.record_capacity(db, scope, 2)
            now = time.time()
            db.execute(
                "INSERT INTO records VALUES (?,?,?,?,?,?)",
                (scope, "rulebook_history", str(version), row["data"], 1, now),
            )
            db.execute(
                "UPDATE records SET data=?,version=version+1,updated=? "
                "WHERE scope=? AND kind='rulebook' AND id='active'",
                (self.store.encrypt(rulebook.model_dump()), now, scope),
            )
            db.execute(
                "INSERT INTO records VALUES (?,?,?,?,?,?)",
                (
                    scope,
                    "audit",
                    secrets.token_hex(16),
                    self.store.encrypt(
                        {
                            "event": "rulebook_updated",
                            "detail": {"version": version + 1},
                            "time": now,
                        }
                    ),
                    1,
                    now,
                ),
            )
        return {**rulebook.model_dump(), "id": "active", "version": version + 1}

    def add_ticket(self, scope: str, ticket: TicketInput, synthetic: bool) -> dict:
        if not synthetic and ticket.channel == "demo":
            synthetic = True
        record_id = secrets.token_hex(16)
        value = {**ticket.model_dump(), "state": "new", "synthetic": synthetic}
        result = self.store.put(scope, "ticket", record_id, value)
        self.store.audit(scope, "ticket_created", {"ticket": record_id, "synthetic": synthetic})
        return result

    def matching_order(self, scope: str, ticket: dict) -> dict | None:
        return next(
            (
                o
                for o in self.store.list(scope, "order")
                if o["number"] == ticket["order_number"]
                and o["customer"].casefold() == ticket["customer"].casefold()
                and o["synthetic"] == ticket["synthetic"]
            ),
            None,
        )

    def eligibility(
        self, ticket: dict, order: dict | None, rules: dict, amount: int | None = None
    ) -> tuple[bool, str]:
        combined = (ticket["subject"] + " " + ticket["body"]).casefold()
        if any(term.casefold() in combined for term in rules["handoff_terms"] if term):
            return False, "Sensitive request requires human review"
        if not order:
            return False, "No authoritative order matches this customer and order number"
        if not order["paid"]:
            return False, "The order is not paid"
        if order["currency"] not in self.store.settings.refund_currencies:
            return False, "Order currency needs a verified refund configuration"
        if order["age_days"] > rules["refund_window_days"]:
            return False, "Order is outside the refund window"
        if ticket["reason"] not in rules["refund_reasons"]:
            return False, "The stated reason is not covered by the active refund policy"
        remaining = order["total_cents"] - order["refunded_cents"]
        proposed = remaining if amount is None else amount
        if proposed <= 0 or proposed > remaining or proposed > rules["max_refund_cents"]:
            return False, "Refund exceeds the refundable balance or store limit"
        return True, "Matched paid order and current refund policy"

    async def recommend(self, scope: str, ticket_id: str, use_ai: bool = False) -> dict:
        ticket = self.store.get(scope, "ticket", ticket_id)
        if not ticket:
            raise KeyError("Ticket not found")
        if ticket["state"] not in {"new", "rejected", "awaiting_approval", "handoff"}:
            raise Conflict("This ticket has already entered execution")
        order = self.matching_order(scope, ticket)
        rules = self.rulebook(scope)
        eligible, reason = self.eligibility(ticket, order, rules)
        action = "refund" if eligible else "handoff"
        recommendation = Recommendation.model_validate(
            {
                "action": action,
                "amount_cents": order["total_cents"] - order["refunded_cents"]
                if eligible and order
                else 0,
                "reason": reason,
                "reply": self.demo["reply_templates"][action],
                "confidence": 1.0,
            }
        )
        if use_ai:
            raw = await self.ai.complete(
                scope,
                "recommend",
                {"ticket": ticket, "order": order, "rulebook": rules},
                schema=Recommendation.model_json_schema(),
            )
            try:
                recommendation = Recommendation.model_validate(json.loads(raw))
            except ValueError as exc:
                raise ValueError("AI recommendation was invalid; no action was taken") from exc
            valid, why = self.eligibility(ticket, order, rules, recommendation.amount_cents)
            if (
                not valid
                or recommendation.confidence < rules["confidence_threshold"]
                or recommendation.action == "handoff"
            ):
                recommendation.action = "handoff"
                recommendation.amount_cents = 0
                recommendation.reason = why if not valid else "Recommendation needs human review"
            elif recommendation.action != "refund":
                recommendation.amount_cents = 0
        value = {
            **ticket,
            "recommendation": recommendation.model_dump(),
            "recommendation_source": "claude" if use_ai else "policy_engine",
            "rulebook_version": rules["version"],
            "order_id": order["id"] if order else None,
            "order_version": order["version"] if order else None,
            "state": "handoff" if recommendation.action == "handoff" else "awaiting_approval",
        }
        result = self.store.put(scope, "ticket", ticket_id, value, ticket["version"])
        self.store.audit(
            scope,
            "recommendation_created",
            {
                "ticket": ticket_id,
                "action": recommendation.action,
                "source": value["recommendation_source"],
            },
        )
        if result["state"] == "handoff":
            self.store.put(scope, "human_queue", ticket_id, self.handoff(scope, ticket_id))
            self.store.audit(scope, "human_review_queued", {"ticket": ticket_id})
        return result

    def decide_demo(self, scope: str, ticket_id: str, version: int, decision: str) -> dict:
        # Order balance, approval version and ticket completion change in ONE transaction.
        with self.store.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT * FROM records WHERE scope=? AND kind='ticket' AND id=?", (scope, ticket_id)
            ).fetchone()
            if not row:
                raise KeyError("Ticket not found")
            ticket = self.store.decrypt(row["data"])
            if row["version"] != version or ticket["state"] != "awaiting_approval":
                raise Conflict("Approval is stale or this action was already handled")
            self.store.record_capacity(db, scope, 1)
            if not ticket["synthetic"]:
                raise Conflict("Real actions require the owner execution connector")
            rules_row = db.execute(
                "SELECT * FROM records WHERE scope=? AND kind='rulebook' AND id='active'", (scope,)
            ).fetchone()
            if not rules_row or rules_row["version"] != ticket["rulebook_version"]:
                raise Conflict("Policy changed; create a new recommendation")
            rules = self.store.decrypt(rules_row["data"])
            if decision == "reject":
                ticket["state"] = "rejected"
            else:
                rec = ticket["recommendation"]
                if rec["action"] == "refund":
                    order_row = db.execute(
                        "SELECT * FROM records WHERE scope=? AND kind='order' AND id=?",
                        (scope, ticket["order_id"]),
                    ).fetchone()
                    if not order_row or order_row["version"] != ticket["order_version"]:
                        raise Conflict("Order changed; create a new recommendation")
                    order = self.store.decrypt(order_row["data"])
                    valid, why = self.eligibility(ticket, order, rules, rec["amount_cents"])
                    if not valid:
                        raise Conflict(why)
                    order["refunded_cents"] += rec["amount_cents"]
                    db.execute(
                        "UPDATE records SET data=?,version=version+1,updated=? WHERE "
                        "scope=? AND kind='order' AND id=?",
                        (self.store.encrypt(order), time.time(), scope, ticket["order_id"]),
                    )
                ticket["state"] = "completed"
                ticket["execution"] = {
                    "mode": "simulation",
                    "refund_cents": rec["amount_cents"],
                    "reply": rec["reply"],
                    "recipient": ticket["customer"],
                    "external_refund": False,
                    "external_message": False,
                    "approved_at": time.time(),
                }
            db.execute(
                "UPDATE records SET data=?,version=version+1,updated=? "
                "WHERE scope=? AND kind='ticket' AND id=?",
                (self.store.encrypt(ticket), time.time(), scope, ticket_id),
            )
            db.execute(
                "INSERT INTO records VALUES (?,?,?,?,?,?)",
                (
                    scope,
                    "audit",
                    secrets.token_hex(16),
                    self.store.encrypt(
                        {
                            "event": "owner_" + decision,
                            "detail": {"ticket": ticket_id, "mode": "simulation"},
                            "time": time.time(),
                        }
                    ),
                    1,
                    time.time(),
                ),
            )
        return {**ticket, "id": ticket_id, "version": version + 1}

    def handoff(self, scope: str, ticket_id: str) -> dict[str, Any]:
        ticket = self.store.get(scope, "ticket", ticket_id)
        if not ticket:
            raise KeyError("Ticket not found")
        return {
            "ticket": ticket,
            "order": self.matching_order(scope, ticket),
            "rulebook_version": self.rulebook(scope)["version"],
            "conversation": list(reversed(self.store.list(scope, "message"))),
            "audit": list(reversed(self.store.list(scope, "audit"))),
            "delivery": "Prepared for owner download; no human notification sent",
        }
