import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from fastapi.testclient import TestClient
from pydantic import SecretStr

from regenai_assistant.config import Settings, content
from regenai_assistant.store import Store


def test_every_setting_has_one_environment_example() -> None:
    root = Path(__file__).resolve().parents[1]
    keys = {
        line.split("=", 1)[0]
        for line in (root / ".env.example").read_text(encoding="utf-8").splitlines()
        if "=" in line
    }
    assert keys == {"ASSISTANT_" + key.upper() for key in Settings.model_fields}
    assert set(content("settings.json")) == set(Settings.model_fields)


def test_business_source_contains_no_provider_urls_models_or_private_keys() -> None:
    root = Path(__file__).resolve().parents[1] / "regenai_assistant"
    forbidden = re.compile(
        r"https?://[a-zA-Z0-9]|sk-or-v1-|sk-ant-api|"
        r"BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|anthropic/claude-"
    )
    for source in root.glob("*.py"):
        # Provider paths and addresses belong to validated data files.
        assert not forbidden.search(source.read_text(encoding="utf-8")), source.name


def test_mcp_token_cannot_use_owner_http_routes(client: TestClient, settings: Settings) -> None:
    headers = {
        "MCP-Protocol-Version": settings.mcp_protocol_version,
        "Authorization": "Bearer " + settings.mcp_token.get_secret_value(),
    }
    response = client.post(
        "/assistant/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
    )
    assert response.status_code == 200
    names = [tool["name"] for tool in response.json()["result"]["tools"]]
    assert all("approve" not in name and "execute" not in name for name in names)
    assert client.get("/assistant/api/export", headers=headers).status_code == 401


def test_mcp_without_origin_accepts_only_its_dedicated_token(
    client: TestClient, settings: Settings
) -> None:
    client.headers.pop("Origin")
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {"protocolVersion": settings.mcp_protocol_version},
    }
    headers = {
        "MCP-Protocol-Version": settings.mcp_protocol_version,
        "Authorization": "Bearer " + settings.mcp_token.get_secret_value(),
    }
    assert (
        client.post("/assistant/mcp", headers=headers, json=payload).json()["result"][
            "protocolVersion"
        ]
        == settings.mcp_protocol_version
    )
    assert client.post("/assistant/api/session", headers=headers).status_code == 403


def test_mcp_never_exposes_approval_tool(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/assistant/mcp",
        headers={
            "MCP-Protocol-Version": settings.mcp_protocol_version,
            "Authorization": "Bearer " + settings.mcp_token.get_secret_value(),
        },
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": "approve_refund", "arguments": {}},
        },
    )
    assert response.json()["result"]["isError"] is True


def test_preferences_survive_reopening_and_erase(session: TestClient, settings: Settings) -> None:
    assert (
        session.put(
            "/assistant/api/memory", json={"text": "I prefer Spanish and concise answers."}
        ).status_code
        == 200
    )
    scope = session.app.state.store.authenticate(session.cookies.get("regenai_assistant_session"))[
        "scope"
    ]
    reopened = Store(settings)
    assert reopened.get(scope, "memory", "preferences")["text"].startswith("I prefer Spanish")
    assert session.get("/assistant/api/workspace").json()["memory"].startswith("I prefer Spanish")
    assert session.delete("/assistant/api/memory").status_code == 200
    assert reopened.get(scope, "memory", "preferences") is None


def test_cancelled_running_job_cannot_be_requeued_by_stale_worker(session: TestClient) -> None:
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    job_id = store.enqueue(scope, "review_pending", 0, 60)
    job = store.claim()
    assert job is not None
    store.cancel_job(scope, job_id)
    store.finish_job(job)
    assert store.jobs(scope)[0]["state"] == "cancelled"


def test_google_callback_requires_same_owner_browser(
    client: TestClient, settings: Settings
) -> None:
    settings.google_client_id = "test-client"
    settings.google_client_secret = SecretStr("test-client-secret")
    client.post(
        "/assistant/api/login", json={"password": settings.owner_password.get_secret_value()}
    )
    redirect = client.get("/assistant/oauth/gmail/start", follow_redirects=False)
    state = parse_qs(urlsplit(redirect.headers["location"]).query)["state"][0]
    client.post(
        "/assistant/api/login", json={"password": settings.owner_password.get_secret_value()}
    )
    assert (
        client.get(
            "/assistant/oauth/gmail/callback", params={"state": state, "code": "test-code"}
        ).status_code
        == 400
    )


def test_shopify_callback_signature_is_required(client: TestClient, settings: Settings) -> None:
    settings.shopify_client_id = "test-client"
    settings.shopify_client_secret = SecretStr("test-client-secret")
    client.post(
        "/assistant/api/login", json={"password": settings.owner_password.get_secret_value()}
    )
    redirect = client.get(
        "/assistant/oauth/shopify/start",
        params={"shop": "example-test.myshopify.com"},
        follow_redirects=False,
    )
    state = parse_qs(urlsplit(redirect.headers["location"]).query)["state"][0]
    response = client.get(
        "/assistant/oauth/shopify/callback",
        params={
            "state": state,
            "code": "test-code",
            "shop": "example-test.myshopify.com",
            "hmac": "invalid",
        },
    )
    assert response.status_code == 400
    assert not client.app.state.store.get("merchant", "connection", "shopify")


def test_sensitive_recommendation_attaches_human_queue(session: TestClient) -> None:
    workspace = session.get("/assistant/api/workspace").json()
    ticket = next(ticket for ticket in workspace["tickets"] if "injury" in ticket["body"].lower())
    response = session.post(
        "/assistant/api/tickets/" + ticket["id"] + "/recommend", json={"use_ai": False}
    )
    assert response.json()["state"] == "handoff"
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    queued = store.get(scope, "human_queue", ticket["id"])
    assert queued["ticket"]["id"] == ticket["id"]
    assert "conversation" in queued and "audit" in queued


def test_ui_has_no_unsafe_html_sinks() -> None:
    root = Path(__file__).resolve().parents[1] / "regenai_assistant" / "static"
    source = (root / "studio.js").read_text(encoding="utf-8")
    assert not re.search(r"innerHTML|outerHTML|insertAdjacentHTML|\beval\(", source)
    assert (
        json.loads((root.parent / "content" / "settings.json").read_text(encoding="utf-8"))[
            "live_actions_enabled"
        ]
        is False
    )
