"""Bounded stdio-to-HTTP MCP bridge for Claude Desktop. Stdout is protocol only."""

import argparse
import json
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

from .config import ClientSettings, load_client_settings


def forward(value: dict, settings: ClientSettings, client: httpx.Client) -> dict | None:
    if value.get("method") != "initialize":
        client.headers["MCP-Protocol-Version"] = settings.mcp_protocol_version
    response = client.post(settings.public_origin + settings.base_path + "/mcp", json=value)
    response.raise_for_status()
    result = response.json() if response.status_code != 202 else None
    if (
        value.get("method") == "initialize"
        and result
        and result.get("result", {}).get("protocolVersion")
    ):
        settings.mcp_protocol_version = result["result"]["protocolVersion"]
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", type=Path, required=True)
    args = parser.parse_args()
    load_dotenv(args.env_file, override=True)
    try:
        settings = load_client_settings()
    except ValueError:
        raise SystemExit(
            "MCP configuration is invalid; check the private client settings"
        ) from None
    with httpx.Client(
        timeout=settings.request_timeout_seconds,
        follow_redirects=False,
        trust_env=False,
        headers={
            "Authorization": "Bearer " + settings.mcp_token.get_secret_value(),
            "Accept": "application/json, text/event-stream",
        },
    ) as client:
        while True:
            line = sys.stdin.buffer.readline(settings.max_body_bytes + 1)
            if not line:
                break
            value: dict = {}
            try:
                if len(line) > settings.max_body_bytes:
                    raise ValueError("Oversized MCP input")
                parsed = json.loads(line)
                if not isinstance(parsed, dict):
                    raise ValueError("MCP requires an object")
                value = parsed
                result = forward(value, settings, client)
            except (ValueError, httpx.HTTPError):
                result = {
                    "jsonrpc": "2.0",
                    "id": value.get("id"),
                    "error": {
                        "code": -32603,
                        "message": "Support connection or input needs review",
                    },
                }
            if result is not None:
                sys.stdout.write(json.dumps(result, ensure_ascii=False) + "\n")
                sys.stdout.flush()
