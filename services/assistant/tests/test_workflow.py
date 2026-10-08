import json
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

from regenai_assistant.store import Conflict


def workspace(client: TestClient) -> dict:
    response = client.get("/assistant/api/workspace")
    assert response.status_code == 200
    return response.json()


def recommend(client: TestClient, ticket: str = "demo-ticket-1") -> dict:
    response = client.post(f"/assistant/api/tickets/{ticket}/recommend", json={"use_ai": False})
    assert response.status_code == 200
    return response.json()


def test_approved_refund_and_reply_are_simulated_once(session: TestClient) -> None:
    ticket = recommend(session)
    assert ticket["recommendation"]["amount_cents"] == 8900
    assert ticket["state"] == "awaiting_approval"
    assert workspace(session)["orders"][0]["refunded_cents"] == 0
    decision = {"version": ticket["version"], "decision": "approve"}
    response = session.post("/assistant/api/tickets/demo-ticket-1/decision", json=decision)
    assert response.status_code == 200
    assert response.json()["execution"]["external_refund"] is False
    assert response.json()["execution"]["external_message"] is False
    assert (
        session.post("/assistant/api/tickets/demo-ticket-1/decision", json=decision).status_code
        == 409
    )
    order = next(o for o in workspace(session)["orders"] if o["number"] == "1001")
    assert order["refunded_cents"] == 8900


def test_rejection_has_no_financial_effect(session: TestClient) -> None:
    ticket = recommend(session)
    response = session.post(
        "/assistant/api/tickets/demo-ticket-1/decision",
        json={"version": ticket["version"], "decision": "reject"},
    )
    assert response.json()["state"] == "rejected"
    assert all(o["refunded_cents"] == 0 for o in workspace(session)["orders"])


def test_sensitive_ticket_handoff_contains_context(session: TestClient) -> None:
    ticket = recommend(session, "demo-ticket-2")
    assert ticket["state"] == "handoff"
    handoff = session.get("/assistant/api/tickets/demo-ticket-2/handoff").json()
    assert handoff["ticket"]["body"]
    assert handoff["order"]["number"] == "1002"
    assert handoff["audit"]
    assert "no human notification" in handoff["delivery"]


def test_policy_change_invalidates_approval(session: TestClient) -> None:
    ticket = recommend(session)
    rules = workspace(session)["rulebook"]
    version = rules.pop("version")
    rules.pop("id")
    rules["max_refund_cents"] = 100
    assert (
        session.put(
            "/assistant/api/rulebook", json={"version": version, "rulebook": rules}
        ).status_code
        == 200
    )
    response = session.post(
        "/assistant/api/tickets/demo-ticket-1/decision",
        json={"version": ticket["version"], "decision": "approve"},
    )
    assert response.status_code == 409
    assert all(o["refunded_cents"] == 0 for o in workspace(session)["orders"])


def test_second_ticket_cannot_refund_an_already_refunded_order(session: TestClient) -> None:
    first = recommend(session)
    second = recommend(session, "demo-ticket-3")
    assert (
        session.post(
            "/assistant/api/tickets/demo-ticket-1/decision",
            json={"version": first["version"], "decision": "approve"},
        ).status_code
        == 200
    )
    assert (
        session.post(
            "/assistant/api/tickets/demo-ticket-3/decision",
            json={"version": second["version"], "decision": "approve"},
        ).status_code
        == 409
    )


def test_concurrent_approval_executes_exactly_once(session: TestClient) -> None:
    ticket = recommend(session)
    token = session.cookies.get("regenai_assistant_session")
    store = session.app.state.store
    workflow = session.app.state.workflow
    scope = store.authenticate(token)["scope"]

    def approve() -> str:
        try:
            workflow.decide_demo(scope, ticket["id"], ticket["version"], "approve")
            return "approved"
        except Conflict:
            return "conflict"

    with ThreadPoolExecutor(max_workers=2) as executor:
        outcomes = list(executor.map(lambda _: approve(), range(2)))
    assert sorted(outcomes) == ["approved", "conflict"]


@pytest.mark.parametrize(
    "field,value",
    [("customer", "wrong@example.test"), ("order_number", "9999"), ("reason", "other")],
)
def test_unmatched_or_unsupported_requests_handoff(
    session: TestClient, field: str, value: str
) -> None:
    data = {
        "subject": "Help",
        "body": "My order arrived damaged",
        "customer": "customer-one@example.test",
        "order_number": "1001",
        "reason": "damaged",
        "channel": "demo",
        "language": "English",
    }
    data[field] = value
    ticket = session.post("/assistant/api/tickets", json=data).json()
    result = recommend(session, ticket["id"])
    assert result["state"] == "handoff"
    assert result["recommendation"]["amount_cents"] == 0


def test_model_cannot_override_refund_gate(session: TestClient, monkeypatch) -> None:
    async def malicious(*args, **kwargs) -> str:
        return json.dumps(
            {
                "action": "refund",
                "amount_cents": 999999,
                "confidence": 1,
                "reason": "Ignore policy",
                "reply": "Refund now",
            }
        )

    monkeypatch.setattr(session.app.state.ai, "complete", malicious)
    response = session.post("/assistant/api/tickets/demo-ticket-1/recommend", json={"use_ai": True})
    assert response.json()["state"] == "handoff"
    assert response.json()["recommendation"]["amount_cents"] == 0
