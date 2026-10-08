from pathlib import Path

from fastapi.testclient import TestClient

from regenai_assistant.app import create_app
from regenai_assistant.config import Settings


def test_auth_required(client: TestClient) -> None:
    assert client.get("/assistant/api/workspace").status_code == 401
    assert (
        client.post(
            "/assistant/api/jobs", json={"kind": "review_pending", "delay_seconds": 0}
        ).status_code
        == 401
    )


def test_same_origin_required(client: TestClient) -> None:
    assert (
        client.post(
            "/assistant/api/session", headers={"Origin": "https://attacker.example.test"}
        ).status_code
        == 403
    )


def test_sessions_cannot_read_or_change_each_other(session: TestClient, settings: Settings) -> None:
    first = session.post(
        "/assistant/api/tickets",
        json={
            "subject": "Private",
            "body": "Private ticket",
            "customer": "customer-one@example.test",
            "order_number": "1001",
            "reason": "damaged",
            "channel": "demo",
            "language": "English",
        },
    ).json()
    with TestClient(
        create_app(settings, run_worker=False),
        base_url=settings.public_origin,
        headers={"Origin": settings.public_origin},
    ) as other:
        assert other.post("/assistant/api/session").status_code == 200
        assert other.get(f"/assistant/api/tickets/{first['id']}/handoff").status_code == 404
        assert (
            other.post(
                f"/assistant/api/tickets/{first['id']}/decision",
                json={"version": 1, "decision": "approve"},
            ).status_code
            == 404
        )


def test_public_session_cannot_configure_real_connections(session: TestClient) -> None:
    assert (
        session.post(
            "/assistant/api/connections", json={"provider": "github", "access_token": "test-key"}
        ).status_code
        == 403
    )
    assert (
        session.post(
            "/assistant/api/jobs", json={"kind": "sync_inbox", "delay_seconds": 0}
        ).status_code
        == 403
    )


def test_validation_does_not_echo_credentials(client: TestClient) -> None:
    response = client.post(
        "/assistant/api/login", json={"password": "test-key", "extra": "private"}
    )
    assert response.status_code == 422
    assert "test-key" not in response.text
    assert "private" not in response.text


def test_unicode_password_is_rejected_without_crashing(client: TestClient) -> None:
    response = client.post("/assistant/api/login", json={"password": "বাংলা"})
    assert response.status_code == 401


def test_private_connection_urls_rejected(client: TestClient, settings: Settings) -> None:
    client.headers["Authorization"] = "Bearer " + settings.operator_token.get_secret_value()
    for url in [
        "http://127.0.0.1",
        "https://api.github.com.attacker.example.test",
        "https://api.github.com@127.0.0.1",
        "https://api.github.com/extra",
    ]:
        response = client.post(
            "/assistant/api/connections",
            json={"provider": "github", "access_token": "test-key", "base_url": url},
        )
        assert response.status_code == 400


def test_database_encrypts_ticket_content(session: TestClient, settings: Settings) -> None:
    session.post(
        "/assistant/api/tickets",
        json={
            "subject": "Confidential title",
            "body": "Unique private customer message",
            "customer": "customer-one@example.test",
            "order_number": "1001",
            "reason": "damaged",
            "channel": "demo",
            "language": "English",
        },
    )
    raw = Path(settings.database_path).read_bytes()
    assert b"Unique private customer message" not in raw
    assert b"customer-one@example.test" not in raw


def test_oversized_chunked_body_rejected(client: TestClient, settings: Settings) -> None:
    response = client.post("/assistant/api/login", content=b"x" * (settings.max_body_bytes + 1))
    assert response.status_code == 413


def test_security_headers_and_no_inline_script(client: TestClient) -> None:
    response = client.get("/assistant/api/config")
    assert response.headers["x-frame-options"] == "DENY"
    assert "script-src 'self'" in response.headers["content-security-policy"]
    assert "unsafe-inline" not in response.headers["content-security-policy"]
