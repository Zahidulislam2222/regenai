"""The single boundary for environment settings and maintained content."""

import ipaddress
import json
import os
import re
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, SecretStr, model_validator

CONTENT = Path(__file__).parent / "content"
STATIC = Path(__file__).parent / "static"


def content(name: str) -> dict:
    return json.loads((CONTENT / name).read_text(encoding="utf-8"))


class Settings(BaseModel):
    model_config = ConfigDict(extra="forbid")
    public_origin: str
    base_path: str
    bind_host: str
    bind_port: int = Field(ge=1, le=65535)
    trusted_proxy_ips: str
    database_path: Path
    encryption_key: SecretStr
    owner_password: SecretStr
    operator_token: SecretStr
    mcp_token: SecretStr
    secure_cookies: bool
    session_seconds: int = Field(ge=60)
    retention_days: int = Field(ge=1, le=365)
    max_body_bytes: int = Field(ge=1024)
    max_message_chars: int = Field(ge=100)
    max_history_messages: int = Field(ge=1, le=100)
    max_memory_chars: int = Field(ge=100, le=4000)
    max_web_context_chars: int = Field(ge=100, le=6000)
    maintenance_interval_seconds: int = Field(ge=60)
    max_output_tokens: int = Field(ge=32, le=4000)
    max_image_bytes: int = Field(ge=100, le=5000000)
    max_sessions: int = Field(ge=1)
    max_records_per_workspace: int = Field(ge=30)
    max_records_total: int = Field(ge=100)
    max_jobs_per_workspace: int = Field(ge=1)
    max_jobs_total: int = Field(ge=1)
    session_ai_turn_limit: int = Field(ge=1)
    request_timeout_seconds: float = Field(gt=0, le=120)
    sqlite_timeout_seconds: float = Field(gt=0)
    rate_limits: dict[str, tuple[int, int]]
    refund_currencies: list[str]
    worker_poll_seconds: float = Field(gt=0)
    worker_lease_seconds: int = Field(ge=30)
    worker_retry_seconds: int = Field(ge=1)
    worker_max_attempts: int = Field(ge=1, le=10)
    ai_enabled: bool
    ai_api_key: SecretStr
    ai_base_url: str
    ai_model: str
    input_price_per_million: Decimal = Field(gt=0)
    output_price_per_million: Decimal = Field(gt=0)
    daily_budget_usd: Decimal = Field(gt=0)
    total_budget_usd: Decimal = Field(gt=0)
    max_prompt_bytes: int = Field(ge=1024)
    image_token_reserve: int = Field(ge=1000)
    web_max_bytes: int = Field(ge=1000)
    web_allowed_hosts: list[str]
    shopify_api_version: str
    shopify_client_id: str
    shopify_client_secret: SecretStr
    shopify_scopes: list[str]
    google_client_id: str
    google_client_secret: SecretStr
    live_actions_enabled: bool
    mcp_protocol_version: str
    app_name: str
    app_version: str

    @model_validator(mode="after")
    def validate_security(self) -> "Settings":
        from cryptography.fernet import Fernet

        Fernet(self.encryption_key.get_secret_value().encode())
        for address in self.trusted_proxy_ips.split(","):
            if address.strip():
                ipaddress.ip_network(address.strip(), strict=False)
        if len(self.owner_password.get_secret_value()) < 16:
            raise ValueError("Owner password must contain at least 16 characters")
        if len(self.operator_token.get_secret_value()) < 32:
            raise ValueError("Operator token must contain at least 32 characters")
        if len(self.mcp_token.get_secret_value()) < 32:
            raise ValueError("MCP token must contain at least 32 characters")
        if self.mcp_token == self.operator_token:
            raise ValueError("MCP and operator tokens must be different")
        origin = urlsplit(self.public_origin)
        if (
            origin.scheme not in {"http", "https"}
            or not origin.hostname
            or origin.path
            or origin.username
            or origin.password
            or origin.query
            or origin.fragment
        ):
            raise ValueError("Public origin must be an HTTP(S) origin without a path")
        if origin.scheme == "http" and origin.hostname not in {"localhost", "127.0.0.1"}:
            raise ValueError("HTTP is allowed only on loopback")
        if origin.scheme == "https" and not self.secure_cookies:
            raise ValueError("Public HTTPS requires secure cookies")
        if not re.fullmatch(r"/[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_-]+)*", self.base_path):
            raise ValueError("Base path must have a leading slash and no trailing slash")
        api = urlsplit(self.ai_base_url)
        if (
            api.scheme != "https"
            or not api.hostname
            or api.username
            or api.password
            or api.query
            or api.fragment
        ):
            raise ValueError("AI provider must use a trusted HTTPS base URL")
        if self.ai_enabled and (not self.ai_model or not self.ai_api_key.get_secret_value()):
            raise ValueError("AI requires an explicit model and key")
        return self


class ClientSettings(BaseModel):
    public_origin: str
    base_path: str
    mcp_token: SecretStr
    request_timeout_seconds: float
    max_body_bytes: int
    mcp_protocol_version: str

    @model_validator(mode="after")
    def validate_endpoint(self) -> "ClientSettings":
        url = urlsplit(self.public_origin)
        if url.username or url.password or url.path or url.query or url.fragment:
            raise ValueError("Use a plain service origin")
        if url.scheme != "https" and not (
            url.scheme == "http" and url.hostname in {"localhost", "127.0.0.1"}
        ):
            raise ValueError("MCP requires HTTPS or loopback")
        if not re.fullmatch(r"/[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_-]+)*", self.base_path):
            raise ValueError("Invalid MCP base path")
        if len(self.mcp_token.get_secret_value()) < 32:
            raise ValueError("Configure the dedicated MCP token")
        return self


def environment_values() -> dict:
    defaults = content("settings.json")
    values = {}
    for name, default in defaults.items():
        raw = os.environ.get("ASSISTANT_" + name.upper())
        if raw is None:
            values[name] = default
        elif isinstance(default, (list, dict)):
            values[name] = json.loads(raw)
        else:
            values[name] = raw
    return values


def load_settings() -> Settings:
    return Settings.model_validate(environment_values())


def load_client_settings() -> ClientSettings:
    values = environment_values()
    return ClientSettings.model_validate({key: values[key] for key in ClientSettings.model_fields})
