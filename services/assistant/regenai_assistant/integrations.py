"""Restricted platform adapters. Credentials stay encrypted and server-side."""

import base64
import re
import time
from datetime import UTC, datetime
from decimal import Decimal
from email.message import EmailMessage
from email.utils import parseaddr
from typing import Any
from urllib.parse import urlsplit

import httpx
from pydantic import Field, SecretStr

from .config import Settings, content
from .models import StrictModel, TicketInput
from .store import Conflict, Store
from .workflow import Workflow


class ConnectionInput(StrictModel):
    provider: str = Field(min_length=1, max_length=50)
    base_url: str = Field(default="", max_length=2000)
    access_token: SecretStr
    refresh_token: SecretStr = SecretStr("")
    username: str = Field(default="", max_length=254)
    client_id: str = Field(default="", max_length=200)
    client_secret: SecretStr = SecretStr("")
    org_id: str = Field(default="", max_length=100)
    expires_at: float = 0


class ConnectionError(Exception):
    pass


class Integrations:
    def __init__(self, settings: Settings, store: Store, workflow: Workflow):
        self.settings = settings
        self.store = store
        self.workflow = workflow
        self.catalog = content("connectors.json")

    def validate_url(self, provider: str, supplied: str) -> str:
        spec = self.catalog.get(provider)
        if spec is None:
            raise ValueError("Unsupported provider")
        base = supplied or spec.get("base_url", "")
        url = urlsplit(base)
        if (
            url.scheme != "https"
            or not url.hostname
            or url.username
            or url.password
            or url.query
            or url.fragment
            or url.port not in {None, 443}
        ):
            raise ValueError("Connector requires a provider HTTPS URL")
        host = url.hostname.casefold()
        if spec.get("host") and host != spec["host"]:
            raise ValueError("Host does not match the selected provider")
        if spec.get("host_suffix"):
            suffix = spec["host_suffix"]
            prefix = host[: -len(suffix)] if host.endswith(suffix) else ""
            if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", prefix):
                raise ValueError("Use the provider's canonical account subdomain")
            if url.path not in {"", "/"}:
                raise ValueError("Account provider URL must not contain a path")
        elif base.rstrip("/") != spec["base_url"].rstrip("/"):
            raise ValueError("Use the provider's documented API base URL")
        return base.rstrip("/")

    def save(self, value: ConnectionInput) -> dict:
        base = self.validate_url(value.provider, value.base_url)
        record = {**value.model_dump(), "base_url": base}
        for name in ["access_token", "refresh_token", "client_secret"]:
            record[name] = getattr(value, name).get_secret_value()
        self.store.put("merchant", "connection", value.provider, record)
        self.store.audit("merchant", "connection_configured", {"provider": value.provider})
        return {"provider": value.provider, "configured": True}

    def statuses(self) -> list[dict]:
        configured = {v["id"]: v for v in self.store.list("merchant", "connection")}
        return [
            {
                "provider": name,
                "label": spec["label"],
                "docs": spec["docs"],
                "configured": name in configured,
                "status": (self.store.get("merchant", "connection_status", name) or {}).get(
                    "status", "Not checked" if name in configured else "Not configured"
                ),
            }
            for name, spec in self.catalog.items()
        ]

    async def credential(self, provider: str) -> dict:
        credential = self.store.get("merchant", "connection", provider)
        if not credential:
            raise ConnectionError("This service has no configured credentials")
        self.validate_url(provider, credential["base_url"])
        if credential.get("expires_at") and credential["expires_at"] <= time.time():
            credential = await self.refresh(provider, credential)
        return credential

    async def refresh(self, provider: str, credential: dict) -> dict:
        spec = self.catalog[provider]
        token_url = spec.get("oauth_token_url")
        if provider == "shopify":
            token_url = credential["base_url"] + "/admin/oauth/access_token"
        if not token_url or not credential.get("refresh_token"):
            raise ConnectionError(
                "Token expired; check token type, revocation and installation, "
                "then reconnect using the owner's consent"
            )
        async with httpx.AsyncClient(
            timeout=self.settings.request_timeout_seconds, follow_redirects=False, trust_env=False
        ) as client:
            response = await client.post(
                token_url,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": credential["refresh_token"],
                    "client_id": credential["client_id"],
                    "client_secret": credential["client_secret"],
                },
            )
        if response.status_code != 200:
            raise ConnectionError(
                "Refresh rejected; verify app credentials, consent and revocation"
            )
        body = response.json()
        if not body.get("access_token"):
            raise ConnectionError("Provider refresh did not return an access token")
        updated = {
            **credential,
            "access_token": body["access_token"],
            "refresh_token": body.get("refresh_token", credential["refresh_token"]),
            "expires_at": time.time() + body["expires_in"] if body.get("expires_in") else 0,
        }
        self.store.put("merchant", "connection", provider, updated, credential["version"])
        self.store.audit("merchant", "token_refreshed", {"provider": provider})
        return updated

    async def request(
        self,
        provider: str,
        method: str,
        path: str,
        payload: dict | None = None,
        params: dict | None = None,
    ) -> Any:
        credential = await self.credential(provider)
        spec = self.catalog[provider]
        token = credential["access_token"]
        headers = {"Accept": "application/json"}
        if spec["auth"] == "basic":
            encoded = base64.b64encode((credential["username"] + ":" + token).encode()).decode()
            headers["Authorization"] = "Basic " + encoded
        elif spec["auth"] == "shopify":
            headers["X-Shopify-Access-Token"] = token
        else:
            headers["Authorization"] = (
                "Zoho-oauthtoken " if spec["auth"] == "zoho" else "Bearer "
            ) + token
        if credential.get("org_id"):
            headers["orgId"] = credential["org_id"]
        if not path.startswith("/") or ".." in path or "://" in path:
            raise ValueError("Invalid provider path")
        async with httpx.AsyncClient(
            timeout=self.settings.request_timeout_seconds, follow_redirects=False, trust_env=False
        ) as client:
            response = await client.request(
                method, credential["base_url"] + path, headers=headers, json=payload, params=params
            )
        if response.status_code == 401:
            # Never blindly repeat a financial action or send after a 401/network error.
            raise ConnectionError(
                "Authentication rejected; check token expiry, refresh, app install "
                "and scopes. No action was automatically retried"
            )
        if response.status_code == 403:
            raise ConnectionError("Permission denied; verify scopes and staff permissions")
        if response.status_code == 429:
            raise ConnectionError("Provider rate limit reached; wait before retrying reads")
        if response.status_code >= 300:
            raise ConnectionError("Provider request failed; inspect the provider audit log")
        if not response.content:
            return {}
        result = response.json()
        if isinstance(result, dict) and result.get("ok") is False:
            raise ConnectionError("Provider declined the request; verify scopes and credentials")
        return result

    async def graphql(self, query: str, variables: dict) -> dict:
        path = "/admin/api/" + self.settings.shopify_api_version + "/graphql.json"
        result = await self.request(
            "shopify", "POST", path, {"query": query, "variables": variables}
        )
        if result.get("errors"):
            raise ConnectionError("Shopify query rejected; verify API version and permissions")
        return result["data"]

    async def check(self, provider: str) -> dict:
        try:
            if provider == "shopify":
                await self.graphql(
                    "query { shop { name } currentAppInstallation { accessScopes { handle } } }", {}
                )
            else:
                spec = self.catalog[provider]
                await self.request(provider, "GET", spec["read_path"], params=spec["read_params"])
            status = "Connected; read check passed"
        except (ConnectionError, httpx.HTTPError) as exc:
            status = str(exc) if isinstance(exc, ConnectionError) else "Network check failed"
        self.store.put(
            "merchant", "connection_status", provider, {"status": status, "checked_at": time.time()}
        )
        return {"provider": provider, "status": status}

    async def lookup_order(self, ticket: dict) -> dict | None:
        data = await self.graphql(
            """query OrderForTicket($query:String!) {
          orders(first:5,query:$query) { nodes { id name email createdAt
          displayFinancialStatus currencyCode totalPriceSet { shopMoney { amount currencyCode } }
          totalRefundedSet { shopMoney { amount currencyCode } }
          transactions(first:20) { id kind status gateway amountSet { shopMoney { amount } } }
          } } }""",
            {"query": "name:#" + ticket["order_number"]},
        )
        for order in data["orders"]["nodes"]:
            if (order.get("email") or "").casefold() != ticket["customer"].casefold():
                continue
            if order["name"].lstrip("#") != ticket["order_number"]:
                continue
            created = datetime.fromisoformat(order["createdAt"].replace("Z", "+00:00"))
            record = {
                "id": order["id"],
                "number": ticket["order_number"],
                "customer": order["email"],
                "currency": order["currencyCode"],
                "total_cents": int(Decimal(order["totalPriceSet"]["shopMoney"]["amount"]) * 100),
                "refunded_cents": int(
                    Decimal(order["totalRefundedSet"]["shopMoney"]["amount"]) * 100
                ),
                "age_days": (datetime.now(UTC) - created).days,
                "paid": order["displayFinancialStatus"] in {"PAID", "PARTIALLY_REFUNDED"},
                "transactions": order["transactions"],
                "synthetic": False,
                "item": "Verified Shopify order",
            }
            return self.store.put("merchant", "order", order["id"], record)
        # A failed fresh lookup must not leave a previously matched cached order eligible.
        cached = self.workflow.matching_order("merchant", ticket)
        if cached:
            with self.store.db() as db:
                db.execute(
                    "DELETE FROM records WHERE scope='merchant' AND kind='order' AND id=?",
                    (cached["id"],),
                )
        return None

    async def fetch_inbox(self, provider: str) -> dict:
        spec = self.catalog[provider]
        if "read_path" not in spec:
            raise ValueError("Select an inbox provider")
        return await self.request(provider, "GET", spec["read_path"], params=spec["read_params"])

    async def sync_gmail(self) -> dict:
        listing = await self.fetch_inbox("gmail")
        added = 0
        for item in listing.get("messages", []):
            external_id = item["id"]
            if not re.fullmatch(r"[a-zA-Z0-9_-]+", external_id):
                continue
            if self.store.get("merchant", "inbox_import", external_id):
                continue
            message = await self.request(
                "gmail", "GET", "/users/me/messages/" + external_id, params={"format": "full"}
            )
            payload = message.get("payload", {})
            headers = {h["name"].casefold(): h["value"] for h in payload.get("headers", [])}
            sender = parseaddr(headers.get("from", ""))[1]
            text = message.get("snippet", "")
            parts = [payload] + payload.get("parts", [])
            for part in parts:
                if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
                    encoded = part["body"]["data"]
                    text = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)).decode(
                        "utf-8", "replace"
                    )
                    break
            match = re.search(r"#([0-9]{1,12})\b", text)
            if not match or not sender:
                self.store.audit(
                    "merchant", "inbox_needs_manual_order_match", {"message": external_id}
                )
                continue
            ticket = TicketInput(
                subject=headers.get("subject", "Support request")[:200],
                body=text[:6000],
                customer=sender,
                order_number=match.group(1),
                reason="other",
                channel="gmail",
                language="Auto",
                external_id=external_id,
            )
            created = self.workflow.add_ticket("merchant", ticket, synthetic=False)
            self.store.put("merchant", "inbox_import", external_id, {"ticket": created["id"]})
            added += 1
        return {"imported": added, "source": "gmail"}

    async def verify_recipient(self, ticket: dict) -> dict:
        provider = ticket["channel"]
        external = ticket.get("external_id", "")
        if not re.fullmatch(r"[a-zA-Z0-9_-]+", external):
            raise ValueError("A verified external ticket identifier is required")
        if provider == "gmail":
            # Read the authoritative sender immediately before send; never trust pasted recipients.
            original = await self.request(
                "gmail", "GET", "/users/me/messages/" + external, params={"format": "metadata"}
            )
            headers = {h["name"].casefold(): h["value"] for h in original["payload"]["headers"]}
            sender = parseaddr(headers.get("from", ""))[1]
            if sender.casefold() != ticket["customer"].casefold():
                raise Conflict("Inbox sender changed or does not match the approved customer")
            return original
        if provider == "zendesk":
            if not external.isdecimal():
                raise ValueError("Zendesk requires a numeric ticket identifier")
            original = await self.request(provider, "GET", "/api/v2/tickets/" + external + ".json")
            requester = original["ticket"]["requester_id"]
            if not isinstance(requester, int) or requester <= 0:
                raise Conflict("Inbox requester is invalid")
            user = await self.request(provider, "GET", "/api/v2/users/" + str(requester) + ".json")
            if (user["user"].get("email") or "").casefold() != ticket["customer"].casefold():
                raise Conflict("Inbox requester does not match the approved customer")
            return original
        raise ConnectionError(
            "This inbox supports read checks only; outbound execution is disabled"
        )

    async def send_reply(self, ticket: dict, reply: str) -> dict:
        provider = ticket["channel"]
        external = ticket["external_id"]
        original = await self.verify_recipient(ticket)
        if provider == "gmail":
            headers = {h["name"].casefold(): h["value"] for h in original["payload"]["headers"]}
            sender = parseaddr(headers.get("from", ""))[1]
            message = EmailMessage()
            message["To"] = sender
            message["Subject"] = "Re: " + headers.get("subject", ticket["subject"])
            if headers.get("message-id"):
                message["In-Reply-To"] = headers["message-id"]
                message["References"] = headers["message-id"]
            message.set_content(reply)
            return await self.request(
                "gmail",
                "POST",
                "/users/me/messages/send",
                {
                    "raw": base64.urlsafe_b64encode(message.as_bytes()).decode(),
                    "threadId": original["threadId"],
                },
            )
        if provider == "zendesk":
            result = await self.request(
                "zendesk",
                "PUT",
                "/api/v2/tickets/" + external + ".json",
                {"ticket": {"comment": {"body": reply, "public": True}}},
            )
            receipt = result.get("ticket", {}).get("id")
            if str(receipt) != external:
                raise ConnectionError("Inbox did not confirm the approved ticket update")
            return {"id": str(receipt)}
        raise ConnectionError(
            "Outbound execution for this inbox has not been activated; "
            "use the approved draft and complete its delivery verification"
        )

    async def execute(self, ticket_id: str, version: int, decision: str) -> dict:
        ticket = self.store.get("merchant", "ticket", ticket_id)
        if not ticket:
            raise KeyError("Ticket not found")
        if ticket["synthetic"]:
            return self.workflow.decide_demo("merchant", ticket_id, version, decision)
        if ticket["state"] != "awaiting_approval" or ticket["version"] != version:
            raise Conflict("Approval is stale or the ticket already entered execution")
        if decision == "reject":
            return self.store.put(
                "merchant", "ticket", ticket_id, {**ticket, "state": "rejected"}, version
            )
        if not self.settings.live_actions_enabled:
            raise Conflict(
                "Live financial and outbound actions are disabled in deployment settings"
            )
        rules = self.workflow.rulebook("merchant")
        if rules["version"] != ticket["rulebook_version"]:
            raise Conflict("Policy changed; generate a new recommendation")
        order = await self.lookup_order(ticket)
        rec = ticket["recommendation"]
        if rec["action"] == "refund":
            valid, reason = self.workflow.eligibility(ticket, order, rules, rec["amount_cents"])
            if not valid:
                raise Conflict(reason)
        # A disabled inbox or unverified requester must fail BEFORE any money movement.
        await self.verify_recipient(ticket)
        # Compare-and-swap before remote calls. Ambiguous failures are held for reconciliation.
        executing = self.store.claim_action(ticket, order, rules)
        execution: dict[str, Any] = {"mode": "live", "refund": None, "message": None}
        try:
            if rec["action"] == "refund" and order:
                parent = next(
                    (
                        t
                        for t in order["transactions"]
                        if t["kind"] in {"SALE", "CAPTURE"}
                        and t["status"] == "SUCCESS"
                        and Decimal(t["amountSet"]["shopMoney"]["amount"]) * 100
                        >= rec["amount_cents"]
                    ),
                    None,
                )
                if not parent:
                    raise Conflict("Refund requires a verified eligible payment transaction")
                data = await self.graphql(
                    """mutation Refund($input:RefundInput!,$key:String!) {
                  refundCreate(input:$input) @idempotent(key:$key) { refund { id
                    transactions(first:10) { nodes { id kind status
                    amountSet { shopMoney { amount currencyCode } } } } }
                  userErrors { field message } } }""",
                    {
                        "key": executing["execution_key"],
                        "input": {
                            "orderId": order["id"],
                            "notify": False,
                            "note": "Owner-approved support resolution " + ticket_id,
                            "transactions": [
                                {
                                    "orderId": order["id"],
                                    "parentId": parent["id"],
                                    "kind": "REFUND",
                                    "gateway": parent["gateway"],
                                    "amount": str(Decimal(rec["amount_cents"]) / 100),
                                }
                            ],
                        },
                    },
                )
                result = data["refundCreate"]
                if result["userErrors"] or not result.get("refund"):
                    raise ConnectionError("Shopify rejected the approved refund")
                execution["refund"] = result["refund"]["id"]
                # Save the refund receipt BEFORE attempting email.
                executing = self.store.put(
                    "merchant",
                    "ticket",
                    ticket_id,
                    {**executing, "execution": execution},
                    executing["version"],
                )
                transactions = result["refund"].get("transactions", {}).get("nodes", [])
                if (
                    len(transactions) != 1
                    or transactions[0].get("status") != "SUCCESS"
                    or transactions[0].get("kind") != "REFUND"
                ):
                    raise ConnectionError("Refund transaction requires reconciliation")
                money = transactions[0]["amountSet"]["shopMoney"]
                if (
                    money["currencyCode"] != order["currency"]
                    or Decimal(money["amount"]) * 100 != rec["amount_cents"]
                ):
                    raise ConnectionError("Refund amount confirmation differs from approval")
            message = await self.send_reply(ticket, rec["reply"])
            if not isinstance(message.get("id"), str) or not message["id"]:
                raise ConnectionError("Inbox did not return a delivery receipt")
            execution["message"] = message["id"]
            result = self.store.put(
                "merchant",
                "ticket",
                ticket_id,
                {**executing, "state": "completed", "execution": execution},
                executing["version"],
            )
            self.store.release_action(ticket_id)
            self.store.put(
                "merchant",
                "audit",
                executing["execution_audit_id"],
                {
                    "event": "live_action_completed",
                    "detail": {"ticket": ticket_id},
                    "time": time.time(),
                },
            )
            return result
        except (ConnectionError, Conflict, httpx.HTTPError, ValueError, KeyError):
            self.store.put(
                "merchant",
                "ticket",
                ticket_id,
                {**executing, "state": "needs_reconciliation", "execution": execution},
                executing["version"],
            )
            self.store.put(
                "merchant",
                "audit",
                executing["execution_audit_id"],
                {
                    "event": "action_needs_reconciliation",
                    "detail": {"ticket": ticket_id},
                    "time": time.time(),
                },
            )
            raise ConnectionError(
                "Execution needs owner reconciliation; no automatic retry will occur"
            ) from None
