import time
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from regenai_assistant.integrations import ConnectionError, ConnectionInput, Integrations

TEST_KEYS = {
    name: "test-" + name
    for name in ("key", "secret", "renewed-key", "refresh-key", "new-refresh-key")
}


def configure(client: TestClient, **updates) -> Integrations:
    values = dict(
        provider="shopify",
        base_url="https://test-store.myshopify.com",
        access_token=TEST_KEYS["key"],
        client_id="test-client",
        client_secret=TEST_KEYS["secret"],
        oauth_grant_type="client_credentials",
        expires_at=time.time() - 1,
    )
    values.update(updates)
    client.app.state.integrations.save(ConnectionInput(**values))
    return client.app.state.integrations


async def test_expired_client_credentials_renew_and_persist(
    client: TestClient, monkeypatch
) -> None:
    adapter = configure(client)
    post = AsyncMock(
        return_value=httpx.Response(
            200, json={"access_token": TEST_KEYS["renewed-key"], "expires_in": 86399}
        )
    )
    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    result = await adapter.credential("shopify")
    assert result["access_token"] == TEST_KEYS["renewed-key"]
    assert result["expires_at"] > time.time()
    assert post.await_count == 1
    assert post.call_args.kwargs["data"] == {
        "grant_type": "client_credentials",
        "client_id": "test-client",
        "client_secret": TEST_KEYS["secret"],
    }
    assert (
        adapter.store.get("merchant", "connection", "shopify")["access_token"]
        == TEST_KEYS["renewed-key"]
    )
    assert (
        sum(
            event["event"] == "token_refreshed" for event in adapter.store.list("merchant", "audit")
        )
        == 1
    )


@pytest.mark.parametrize(
    "body",
    [
        {"expires_in": 86399},
        {"access_token": TEST_KEYS["key"]},
        {"access_token": TEST_KEYS["key"], "expires_in": -1},
        {"access_token": TEST_KEYS["key"], "expires_in": "invalid"},
        {"access_token": TEST_KEYS["key"], "expires_in": True},
        {"access_token": 123, "expires_in": 86399},
    ],
)
async def test_invalid_renewal_preserves_original_token(
    client: TestClient, monkeypatch, body
) -> None:
    adapter = configure(client)
    before = adapter.store.get("merchant", "connection", "shopify")
    monkeypatch.setattr(
        httpx.AsyncClient, "post", AsyncMock(return_value=httpx.Response(200, json=body))
    )
    with pytest.raises(ConnectionError):
        await adapter.credential("shopify")
    assert adapter.store.get("merchant", "connection", "shopify") == before


async def test_current_client_token_is_reused(client: TestClient, monkeypatch) -> None:
    adapter = configure(client, expires_at=time.time() + 86399)
    post = AsyncMock()
    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    assert (await adapter.credential("shopify"))["access_token"] == TEST_KEYS["key"]
    post.assert_not_called()


async def test_existing_refresh_grant_preserves_rotated_refresh_token(
    client: TestClient, monkeypatch
) -> None:
    adapter = configure(
        client, oauth_grant_type="refresh_token", refresh_token=TEST_KEYS["refresh-key"]
    )
    post = AsyncMock(
        return_value=httpx.Response(
            200,
            json={
                "access_token": TEST_KEYS["renewed-key"],
                "refresh_token": TEST_KEYS["new-refresh-key"],
                "expires_in": 86399,
            },
        )
    )
    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    assert (await adapter.credential("shopify"))["refresh_token"] == TEST_KEYS["new-refresh-key"]
    assert post.call_args.kwargs["data"]["grant_type"] == "refresh_token"
    assert post.call_args.kwargs["data"]["refresh_token"] == TEST_KEYS["refresh-key"]


@pytest.mark.parametrize(
    "changes",
    [
        {"provider": "gmail", "base_url": "https://gmail.googleapis.com/gmail/v1"},
        {"client_id": ""},
        {"client_secret": ""},
        {"expires_at": 0},
        {"expires_at": float("inf")},
        {"expires_at": True},
        {"client_id": "  "},
        {"client_secret": "  "},
    ],
)
def test_invalid_client_grant_configuration_rejected(client: TestClient, changes) -> None:
    with pytest.raises(ValidationError):
        configure(client, **changes)


@pytest.mark.parametrize("expiry", [None, 0, True, float("nan"), float("inf"), -1])
async def test_malformed_stored_client_expiry_blocks_outbound_calls(
    client: TestClient, monkeypatch, expiry
) -> None:
    adapter = configure(client)
    stored = adapter.store.get("merchant", "connection", "shopify")
    stored["expires_at"] = expiry
    adapter.store.put("merchant", "connection", "shopify", stored, stored["version"])
    post = AsyncMock()
    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    with pytest.raises(ConnectionError):
        await adapter.credential("shopify")
    post.assert_not_called()


async def test_legacy_non_expiring_connection_reused(client: TestClient, monkeypatch) -> None:
    adapter = configure(client, oauth_grant_type="refresh_token", expires_at=0)
    post = AsyncMock()
    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    assert (await adapter.credential("shopify"))["access_token"] == TEST_KEYS["key"]
    post.assert_not_called()


async def test_missing_refresh_response_lifetime_preserves_credentials(
    client: TestClient, monkeypatch
) -> None:
    adapter = configure(
        client, oauth_grant_type="refresh_token", refresh_token=TEST_KEYS["refresh-key"]
    )
    original = adapter.store.get("merchant", "connection", "shopify")
    monkeypatch.setattr(
        httpx.AsyncClient,
        "post",
        AsyncMock(
            return_value=httpx.Response(200, json={"access_token": TEST_KEYS["renewed-key"]})
        ),
    )
    with pytest.raises(ConnectionError):
        await adapter.credential("shopify")
    assert adapter.store.get("merchant", "connection", "shopify") == original
