import time
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from test_live_action_boundaries import prepared

from regenai_assistant.bridge import forward
from regenai_assistant.config import ClientSettings, Settings
from regenai_assistant.integrations import ConnectionError
from regenai_assistant.models import Rulebook
from regenai_assistant.store import BudgetExceeded
from regenai_assistant.worker import work_once


def test_new_record_quota_is_transactional_but_existing_updates_work(session: TestClient) -> None:
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    with store.db() as db:
        count = db.execute("SELECT COUNT(*) FROM records WHERE scope=?", (scope,)).fetchone()[0]
    store.settings.max_records_per_workspace = count
    with pytest.raises(BudgetExceeded):
        store.put(scope, "setup", "new-test-note", {"note": "test"})
    current = store.get(scope, "rulebook", "active")
    assert store.put(scope, "rulebook", "active", current)["version"] > current["version"]


def test_job_capacity_is_enforced(session: TestClient) -> None:
    store = session.app.state.store
    store.settings.max_jobs_per_workspace = 1
    store.enqueue("test-scope", "review_pending", 0)
    with pytest.raises(BudgetExceeded):
        store.enqueue("test-scope", "review_pending", 0)


def test_lease_crashes_stop_at_configured_attempt_count(session: TestClient) -> None:
    store = session.app.state.store
    job_id = store.enqueue("test-scope", "review_pending", 0)
    for _ in range(store.settings.worker_max_attempts):
        assert store.claim() is not None
        with store.db() as db:
            db.execute("UPDATE jobs SET lease=? WHERE id=?", (time.time() - 1, job_id))
    assert store.claim() is None
    assert store.jobs("test-scope")[0]["state"] == "failed"


def test_handoff_exports_all_history_beyond_one_hundred(session: TestClient) -> None:
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    for index in range(121):
        store.audit(scope, "test-event", {"index": index})
    ticket = store.list(scope, "ticket")[0]
    bundle = session.app.state.workflow.handoff(scope, ticket["id"])
    assert len(bundle["audit"]) == 122
    assert bundle["audit"][0]["event"] == "workspace_created"


async def test_failed_refund_receipt_never_sends_reply(session: TestClient, monkeypatch) -> None:
    ticket, order = await prepared(session)
    adapters = session.app.state.integrations
    monkeypatch.setattr(adapters, "lookup_order", AsyncMock(return_value=order))
    monkeypatch.setattr(adapters, "verify_recipient", AsyncMock(return_value={}))
    graphql = AsyncMock(
        return_value={
            "refundCreate": {
                "refund": {
                    "id": "test-refund",
                    "transactions": {"nodes": [{"kind": "REFUND", "status": "FAILURE"}]},
                },
                "userErrors": [],
            }
        }
    )
    monkeypatch.setattr(adapters, "graphql", graphql)
    send = AsyncMock()
    monkeypatch.setattr(adapters, "send_reply", send)
    with pytest.raises(ConnectionError):
        await adapters.execute(ticket["id"], ticket["version"], "approve")
    send.assert_not_called()
    held = session.app.state.store.get("merchant", "ticket", ticket["id"])
    assert held["state"] == "needs_reconciliation"
    assert held["execution"]["refund"] == "test-refund"
    query, variables = graphql.call_args.args
    assert "@idempotent(key:$key)" in query and variables["key"] == held["execution_key"]


async def test_missing_send_receipt_never_marks_completed(session: TestClient, monkeypatch) -> None:
    ticket, order = await prepared(session)
    adapters = session.app.state.integrations
    monkeypatch.setattr(adapters, "lookup_order", AsyncMock(return_value=order))
    monkeypatch.setattr(adapters, "verify_recipient", AsyncMock(return_value={}))
    monkeypatch.setattr(
        adapters,
        "graphql",
        AsyncMock(
            return_value={
                "refundCreate": {
                    "refund": {
                        "id": "test-refund",
                        "transactions": {
                            "nodes": [
                                {
                                    "kind": "REFUND",
                                    "status": "SUCCESS",
                                    "amountSet": {
                                        "shopMoney": {"amount": "89.00", "currencyCode": "USD"}
                                    },
                                }
                            ]
                        },
                    },
                    "userErrors": [],
                }
            }
        ),
    )
    monkeypatch.setattr(adapters, "send_reply", AsyncMock(return_value={}))
    with pytest.raises(ConnectionError):
        await adapters.execute(ticket["id"], ticket["version"], "approve")
    assert (
        session.app.state.store.get("merchant", "ticket", ticket["id"])["state"]
        == "needs_reconciliation"
    )


def test_mutation_rate_applies_to_ticket_and_setup_writes(session: TestClient) -> None:
    session.app.state.store.settings.rate_limits["mutations"] = (1, 60)
    assert (
        session.post("/assistant/api/setup", json={"step": "test", "note": "first"}).status_code
        == 200
    )
    assert (
        session.post("/assistant/api/setup", json={"step": "test", "note": "second"}).status_code
        == 429
    )


def test_oauth_callback_cookie_survives_cross_site_return(
    client: TestClient, settings: Settings
) -> None:
    settings.google_client_id = "test-client"
    settings.google_client_secret = SecretStr("test-client-secret")
    client.post(
        "/assistant/api/login", json={"password": settings.owner_password.get_secret_value()}
    )
    start = client.get("/assistant/oauth/gmail/start", follow_redirects=False)
    assert "SameSite=lax" in start.headers["set-cookie"]
    assert "Path=/assistant/oauth" in start.headers["set-cookie"]
    state = parse_qs(urlsplit(start.headers["location"]).query)["state"][0]
    # Simulate the Strict session cookie being withheld on provider return.
    callback_cookie = client.cookies.get("regenai_assistant_oauth_browser")
    client.cookies.clear()
    client.cookies.set("regenai_assistant_oauth_browser", callback_cookie, path="/assistant/oauth")
    response = client.get("/assistant/oauth/gmail/callback", params={"state": state, "code": ""})
    assert response.status_code == 400  # State validation, rather than lost-owner 403.


def test_bridge_supplies_negotiated_mcp_version(settings: Settings) -> None:
    captured = []

    def handler(request: httpx.Request) -> httpx.Response:
        captured.append(request.headers.get("mcp-protocol-version"))
        return httpx.Response(200, json={"jsonrpc": "2.0", "id": 1, "result": {}})

    values = settings.model_dump()
    client_settings = ClientSettings.model_validate(
        {key: values[key] for key in ClientSettings.model_fields}
    )
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        forward({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, client_settings, client)
    assert captured == [settings.mcp_protocol_version]


def test_mcp_rejects_unsupported_protocol(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/assistant/mcp",
        headers={
            "Authorization": "Bearer " + settings.mcp_token.get_secret_value(),
            "MCP-Protocol-Version": "invalid",
        },
        json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
    )
    assert response.status_code == 400


async def test_full_workspace_does_not_kill_worker(session: TestClient) -> None:
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    job_id = store.enqueue(scope, "retention", 0)
    with store.db() as db:
        count = db.execute("SELECT COUNT(*) FROM records WHERE scope=?", (scope,)).fetchone()[0]
    store.settings.max_records_per_workspace = count
    assert await work_once(store, session.app.state.workflow, session.app.state.integrations)
    job = next(j for j in store.jobs(scope) if j["id"] == job_id)
    assert job["state"] == "completed" and "Audit storage" in job["error"]


async def test_financial_claim_reserves_audit_capacity_before_locking(session: TestClient) -> None:
    ticket, order = await prepared(session)
    store = session.app.state.store
    rules = session.app.state.workflow.rulebook("merchant")
    with store.db() as db:
        count = db.execute("SELECT COUNT(*) FROM records WHERE scope='merchant'").fetchone()[0]
    store.settings.max_records_per_workspace = count + 1
    with pytest.raises(BudgetExceeded):
        store.claim_action(ticket, order, rules)
    assert store.get("merchant", "ticket", ticket["id"])["state"] == "awaiting_approval"
    with store.db() as db:
        assert db.execute("SELECT COUNT(*) FROM action_locks").fetchone()[0] == 0


def test_policy_update_rolls_back_when_history_has_no_capacity(session: TestClient) -> None:
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    old = session.app.state.workflow.rulebook(scope)
    rules = Rulebook.model_validate({k: v for k, v in old.items() if k not in {"id", "version"}})
    rules.voice = "A changed test voice."
    with store.db() as db:
        count = db.execute("SELECT COUNT(*) FROM records WHERE scope=?", (scope,)).fetchone()[0]
    store.settings.max_records_per_workspace = count + 1
    with pytest.raises(BudgetExceeded):
        session.app.state.workflow.save_rulebook(scope, rules, old["version"])
    assert session.app.state.workflow.rulebook(scope)["voice"] == old["voice"]


def test_demo_approval_and_its_audit_are_atomic_at_capacity(session: TestClient) -> None:
    recommendation = session.post(
        "/assistant/api/tickets/demo-ticket-1/recommend", json={"use_ai": False}
    ).json()
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    with store.db() as db:
        count = db.execute("SELECT COUNT(*) FROM records WHERE scope=?", (scope,)).fetchone()[0]
    store.settings.max_records_per_workspace = count
    result = session.post(
        "/assistant/api/tickets/demo-ticket-1/decision",
        json={"decision": "approve", "version": recommendation["version"]},
    )
    assert result.status_code == 429
    assert store.get(scope, "ticket", "demo-ticket-1")["state"] == "awaiting_approval"
    assert store.get(scope, "order", "demo-order-1001")["refunded_cents"] == 0
