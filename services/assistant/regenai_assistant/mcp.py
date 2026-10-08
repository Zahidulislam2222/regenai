"""Stateless JSON MCP transport with recommendation-only tools."""

import json
import secrets
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from pydantic import Field

from .config import Settings, content
from .integrations import Integrations
from .models import StrictModel
from .store import Conflict, Store
from .workflow import Workflow


class Envelope(StrictModel):
    jsonrpc: str = Field(pattern=r"^2\.0$")
    id: int | str | None = None
    method: str = Field(max_length=100)
    params: dict = Field(default_factory=dict)


def register_mcp(
    app: FastAPI, settings: Settings, store: Store, workflow: Workflow, integrations: Integrations
) -> None:
    tools = content("mcp-tools.json")["tools"]

    @app.post(settings.base_path + "/mcp")
    async def handle(value: Envelope, request: Request) -> Response:
        if not secrets.compare_digest(
            request.headers.get("authorization", ""),
            "Bearer " + settings.mcp_token.get_secret_value(),
        ):
            raise HTTPException(401, "MCP requires its dedicated recommendation token")
        store.rate("mcp:merchant", *settings.rate_limits["mcp"])
        protocol = request.headers.get("mcp-protocol-version")
        if protocol is not None and protocol != settings.mcp_protocol_version:
            raise HTTPException(400, "Unsupported MCP protocol version")
        if value.method != "initialize" and protocol is None:
            raise HTTPException(400, "MCP protocol version header is required after initialization")
        if value.id is None:
            return Response(status_code=202)
        result: dict = {}
        if value.method == "initialize":
            requested = value.params.get("protocolVersion")
            if requested != settings.mcp_protocol_version:
                result = {"protocolVersion": settings.mcp_protocol_version}
            result.update(
                {
                    "protocolVersion": settings.mcp_protocol_version,
                    "capabilities": {"tools": {"listChanged": False}},
                    "serverInfo": {"name": settings.app_name, "version": settings.app_version},
                }
            )
        elif value.method == "ping":
            result = {}
        elif value.method == "tools/list":
            result = {"tools": tools}
        elif value.method == "tools/call":
            data: Any
            name = value.params.get("name")
            arguments = value.params.get("arguments", {})
            if not isinstance(arguments, dict):
                raise ValueError("Tool arguments must be an object")
            try:
                if name == "support_list_tickets":
                    data = store.list("merchant", "ticket")
                elif name == "support_get_rulebook":
                    data = workflow.rulebook("merchant")
                elif name in {"support_review_ticket", "support_get_handoff"}:
                    ticket_id = arguments.get("ticket_id")
                    if not isinstance(ticket_id, str) or len(ticket_id) > 100:
                        raise ValueError("A bounded ticket_id is required")
                    if name == "support_get_handoff":
                        data = workflow.handoff("merchant", ticket_id)
                    else:
                        ticket = store.get("merchant", "ticket", ticket_id)
                        if ticket and not ticket["synthetic"]:
                            await integrations.lookup_order(ticket)
                        data = await workflow.recommend("merchant", ticket_id)
                elif name == "support_schedule_review":
                    data = {"job": store.enqueue("merchant", "review_pending", 0)}
                else:
                    raise ValueError("Unknown tool")
                result = {"content": [{"type": "text", "text": json.dumps(data)}]}
            except (ValueError, KeyError, Conflict):
                result = {
                    "content": [{"type": "text", "text": "Tool input or record is invalid"}],
                    "isError": True,
                }
        else:
            return JSONResponse(
                {
                    "jsonrpc": "2.0",
                    "id": value.id,
                    "error": {"code": -32601, "message": "Method not found"},
                }
            )
        return JSONResponse({"jsonrpc": "2.0", "id": value.id, "result": result})
