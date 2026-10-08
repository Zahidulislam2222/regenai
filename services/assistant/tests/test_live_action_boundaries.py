from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from regenai_assistant.integrations import ConnectionError
from regenai_assistant.models import TicketInput
from regenai_assistant.store import Conflict


async def prepared(session: TestClient, channel: str = "gmail") -> tuple[dict, dict]:
    workflow = session.app.state.workflow
    store = session.app.state.store
    ticket = workflow.add_ticket(
        "merchant",
        TicketInput(
            subject="Damaged order",
            body="The item arrived broken.",
            customer="test-customer@example.test",
            order_number="1001",
            reason="damaged",
            channel=channel,
            language="English",
            external_id="123",
        ),
        synthetic=False,
    )
    order = store.put(
        "merchant",
        "order",
        "live-test-order",
        {
            "number": "1001",
            "customer": ticket["customer"],
            "currency": "USD",
            "total_cents": 8900,
            "refunded_cents": 0,
            "paid": True,
            "age_days": 5,
            "synthetic": False,
            "transactions": [
                {
                    "id": "test-payment",
                    "kind": "SALE",
                    "status": "SUCCESS",
                    "gateway": "test-gateway",
                    "amountSet": {"shopMoney": {"amount": "89.00"}},
                }
            ],
        },
    )
    ticket = await workflow.recommend("merchant", ticket["id"])
    session.app.state.integrations.settings.live_actions_enabled = True
    return ticket, order


async def test_unsupported_inbox_is_blocked_before_refund(session: TestClient, monkeypatch) -> None:
    ticket, order = await prepared(session, "front")
    adapters = session.app.state.integrations
    monkeypatch.setattr(adapters, "lookup_order", AsyncMock(return_value=order))
    graphql = AsyncMock()
    monkeypatch.setattr(adapters, "graphql", graphql)
    with pytest.raises(ConnectionError):
        await adapters.execute(ticket["id"], ticket["version"], "approve")
    graphql.assert_not_called()
    assert (
        session.app.state.store.get("merchant", "ticket", ticket["id"])["state"]
        == "awaiting_approval"
    )


async def test_zendesk_wrong_requester_is_blocked(session: TestClient, monkeypatch) -> None:
    ticket, _ = await prepared(session, "zendesk")
    adapters = session.app.state.integrations
    monkeypatch.setattr(
        adapters,
        "request",
        AsyncMock(
            side_effect=[
                {"ticket": {"requester_id": 123}},
                {"user": {"email": "wrong-customer@example.test"}},
            ]
        ),
    )
    with pytest.raises(Conflict):
        await adapters.verify_recipient(ticket)


async def test_refund_receipt_is_saved_when_reply_fails_and_retry_is_blocked(
    session: TestClient, monkeypatch
) -> None:
    ticket, order = await prepared(session)
    adapters = session.app.state.integrations
    monkeypatch.setattr(adapters, "lookup_order", AsyncMock(return_value=order))
    monkeypatch.setattr(adapters, "verify_recipient", AsyncMock(return_value={}))
    graphql = AsyncMock(
        return_value={"refundCreate": {"refund": {"id": "test-refund-receipt"}, "userErrors": []}}
    )
    monkeypatch.setattr(adapters, "graphql", graphql)
    monkeypatch.setattr(
        adapters, "send_reply", AsyncMock(side_effect=ConnectionError("test-send-failure"))
    )
    with pytest.raises(ConnectionError):
        await adapters.execute(ticket["id"], ticket["version"], "approve")
    held = session.app.state.store.get("merchant", "ticket", ticket["id"])
    assert held["state"] == "needs_reconciliation"
    assert held["execution"]["refund"] == "test-refund-receipt"
    with pytest.raises(Conflict):
        await adapters.execute(ticket["id"], held["version"], "approve")
    assert graphql.await_count == 1


async def test_order_lock_prevents_concurrent_ticket_claims(session: TestClient) -> None:
    ticket, order = await prepared(session)
    store = session.app.state.store
    rules = session.app.state.workflow.rulebook("merchant")
    store.claim_action(ticket, order, rules)
    second = store.put(
        "merchant", "ticket", "second-test-ticket", {**ticket, "id": "second-test-ticket"}
    )
    with pytest.raises(Conflict):
        store.claim_action(second, order, rules)
