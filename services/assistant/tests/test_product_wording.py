"""Guard product wording without weakening financial isolation or receipt disclosure."""

import re
from pathlib import Path

from regenai_assistant.config import content

FORBIDDEN = re.compile(
    r"\b(?:demo|sandbox|simulation|simulated|fictional|synthetic|portfolio|concepts?|preview|mock)\b",
    re.IGNORECASE,
)


def human_strings(value, field=""):
    if isinstance(value, dict):
        for key, item in value.items():
            if key not in {"id", "channel", "channels"}:
                yield from human_strings(item, key)
    elif isinstance(value, list):
        for item in value:
            yield from human_strings(item, field)
    elif isinstance(value, str) and not value.startswith(("/", "http://", "https://")):
        yield value


def test_maintained_support_copy_uses_product_language():
    for name in ["ui.json", "demo.json", "prompts.json", "storefront.json", "mcp-tools.json"]:
        for text in human_strings(content(name)):
            assert not FORBIDDEN.search(text), (name, text)
    html = (Path(__file__).resolve().parents[1] / "regenai_assistant/static/index.html").read_text(
        encoding="utf-8"
    )
    visible = re.sub(r"<[^>]+>", " ", html)
    assert not FORBIDDEN.search(visible)


def test_relabeling_preserves_external_action_boundaries(session):
    result = session.post(
        "/assistant/api/tickets/demo-ticket-1/recommend", json={"use_ai": False}
    ).json()
    decision = session.post(
        "/assistant/api/tickets/demo-ticket-1/decision",
        json={"version": result["version"], "decision": "approve"},
    ).json()
    assert decision["execution"]["external_refund"] is False
    assert decision["execution"]["external_message"] is False
    assert "No refund or email was sent" in content("ui.json")["text"]["text_7"]
    assert content("ui.json")["channels"]["demo"] == "Workspace"


def test_session_capacity_http_error_uses_product_copy(session, settings):
    settings.max_sessions = 1
    session.cookies.clear()
    result = session.post("/assistant/api/session")
    assert result.status_code == 429
    assert result.json()["detail"] == content("ui.json")["errors"]["session_capacity"]
    assert not FORBIDDEN.search(result.json()["detail"])


def test_ai_turn_limit_error_uses_product_copy(session, settings):
    from decimal import Decimal

    import pytest

    from regenai_assistant.store import BudgetExceeded

    settings.session_ai_turn_limit = 1
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    store.reserve(scope, Decimal("0.001"))
    with pytest.raises(BudgetExceeded) as failure:
        store.reserve(scope, Decimal("0.001"))
    assert str(failure.value) == content("ui.json")["errors"]["session_ai_allowance"]
    assert not FORBIDDEN.search(str(failure.value))


def test_html_and_multilingual_data_ignore_platform_default_encoding(session, monkeypatch):
    original_read = Path.read_text

    def windows_read(path, *args, **kwargs):
        if "encoding" not in kwargs and not args:
            kwargs["encoding"] = "cp1252"
        return original_read(path, *args, **kwargs)

    monkeypatch.setattr(Path, "read_text", windows_read)
    response = session.get("/assistant")
    assert response.status_code == 200
    assert "Let’s" in response.text or "↗" in response.text
    assert content("demo.json")["tickets"][2]["body"].startswith("Recibí")
