from unittest.mock import AsyncMock

import httpx
from fastapi.testclient import TestClient

from regenai_assistant.integrations import ConnectionInput


async def test_gmail_sync_reads_only_the_selected_support_label(
    client: TestClient, monkeypatch
) -> None:
    adapter = client.app.state.integrations
    adapter.save(ConnectionInput.model_validate({"provider": "gmail", "access_token": "test-key"}))
    existing = adapter.store.list("merchant", "ticket")
    request = AsyncMock(return_value=httpx.Response(200, json={"messages": []}))
    monkeypatch.setattr(httpx.AsyncClient, "request", request)

    assert await adapter.sync_gmail() == {"imported": 0, "source": "gmail"}
    request.assert_awaited_once()
    assert request.call_args.args == (
        "GET",
        "https://gmail.googleapis.com/gmail/v1/users/me/messages",
    )
    assert request.call_args.kwargs["params"] == {
        "maxResults": 10,
        "q": 'label:"RegenAI Support"',
    }
    assert adapter.store.list("merchant", "ticket") == existing
