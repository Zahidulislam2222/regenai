import secrets
from pathlib import Path

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from regenai_assistant.app import create_app
from regenai_assistant.config import Settings, content


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    values = content("settings.json")
    values.update(
        database_path=str(tmp_path / "state.sqlite3"),
        encryption_key=Fernet.generate_key().decode(),
        owner_password="test-" + secrets.token_urlsafe(24),
        operator_token="test-operator-token-" * 3,
        mcp_token="test-mcp-recommendation-token-" * 3,
    )
    return Settings.model_validate(values)


@pytest.fixture
def client(settings: Settings):
    with TestClient(
        create_app(settings, run_worker=False),
        base_url=settings.public_origin,
        headers={"Origin": settings.public_origin},
    ) as current:
        yield current


@pytest.fixture
def session(client: TestClient) -> TestClient:
    assert client.post("/assistant/api/session").status_code == 200
    return client
