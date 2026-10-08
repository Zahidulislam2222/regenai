"""Authenticated HTTP routes for the public workspaces and private merchant console."""

import asyncio
import contextlib
import hashlib
import json
import secrets
import time
from contextlib import asynccontextmanager
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import Field

from .ai import AI, ProviderUnavailable
from .config import STATIC, Settings, content, load_settings
from .integrations import ConnectionError, ConnectionInput, Integrations
from .mcp import register_mcp
from .models import (
    ChatRequest,
    DecisionRequest,
    ExamplesRequest,
    LoginRequest,
    MemoryRequest,
    Rulebook,
    ScheduleRequest,
    SetupEntry,
    StrictModel,
    TicketInput,
    WebRequest,
)
from .oauth import register_oauth
from .store import BudgetExceeded, Conflict, Store
from .web import fetch_web
from .worker import worker_loop
from .workflow import Workflow


class RulebookUpdate(StrictModel):
    rulebook: Rulebook
    version: int = Field(ge=1)


class RecommendationRequest(StrictModel):
    use_ai: bool = False


def create_app(settings: Settings | None = None, run_worker: bool = True) -> FastAPI:
    settings = settings or load_settings()
    store = Store(settings)
    ai = AI(settings, store)
    workflow = Workflow(store, ai)
    integrations = Integrations(settings, store, workflow)
    workflow.seed("merchant")
    if run_worker and not store.get("system", "maintenance", "retention"):
        maintenance_job = store.enqueue(
            "system", "retention", 0, settings.maintenance_interval_seconds
        )
        store.put("system", "maintenance", "retention", {"job": maintenance_job})

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        task = (
            asyncio.create_task(worker_loop(store, workflow, integrations)) if run_worker else None
        )
        if task:

            def worker_stopped(finished: asyncio.Task) -> None:
                if not finished.cancelled() and finished.exception() is not None:
                    _.state.worker_failed = True
                    server = getattr(_.state, "server", None)
                    if server is not None:
                        server.should_exit = True

            task.add_done_callback(worker_stopped)
        try:
            yield
        finally:
            if task:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError, Exception):
                    await task

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
    )
    app.state.store = store
    app.state.workflow = workflow
    app.state.ai = ai
    app.state.integrations = integrations
    base = settings.base_path
    cookie = "regenai_assistant_session"

    @app.middleware("http")
    async def boundaries(request: Request, call_next):
        if request.method not in {"GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"}:
            return JSONResponse({"detail": "Method not allowed"}, status_code=405)
        if request.method in {"POST", "PUT", "DELETE"}:
            bearer = request.headers.get("authorization", "")
            valid_operator = secrets.compare_digest(
                bearer, "Bearer " + settings.operator_token.get_secret_value()
            )
            valid_mcp = request.url.path == settings.base_path + "/mcp" and secrets.compare_digest(
                bearer, "Bearer " + settings.mcp_token.get_secret_value()
            )
            if request.headers.get("origin") != settings.public_origin and not (
                valid_operator or valid_mcp
            ):
                return JSONResponse({"detail": "Same-origin request required"}, status_code=403)
            if request.url.path.startswith(base + "/api/") and request.url.path not in {
                base + "/api/session",
                base + "/api/login",
            }:
                principal = (
                    {"scope": "merchant"}
                    if valid_operator
                    else store.authenticate(request.cookies.get(cookie, ""))
                )
                if principal:
                    try:
                        store.rate(
                            "mutations:" + principal["scope"], *settings.rate_limits["mutations"]
                        )
                    except BudgetExceeded:
                        return JSONResponse(
                            {"detail": "Mutation rate limit reached"}, status_code=429
                        )
            chunks = []
            length = 0
            async for chunk in request.stream():
                length += len(chunk)
                if length > settings.max_body_bytes:
                    return JSONResponse({"detail": "Request too large"}, status_code=413)
                chunks.append(chunk)
            request._body = b"".join(chunks)
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Robots-Tag"] = "noindex, nofollow"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
            "connect-src 'self'; font-src 'self'; media-src 'self' blob:; "
            "base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
        )
        return response

    def actor(request: Request) -> dict:
        bearer = request.headers.get("authorization", "")
        if secrets.compare_digest(bearer, "Bearer " + settings.operator_token.get_secret_value()):
            return {"scope": "merchant", "role": "owner"}
        current = store.authenticate(request.cookies.get(cookie, ""))
        if current is None:
            raise HTTPException(401, "Start a session first")
        return current

    Actor = Annotated[dict, Depends(actor)]

    def owner(current: Actor) -> dict:
        if current["role"] != "owner":
            raise HTTPException(403, "Owner access required")
        return current

    Owner = Annotated[dict, Depends(owner)]

    def set_cookie(response: Response, token: str) -> None:
        response.set_cookie(
            cookie,
            token,
            httponly=True,
            secure=settings.secure_cookies,
            samesite="strict",
            path=base,
            max_age=settings.session_seconds,
        )

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_: Request, __: RequestValidationError) -> JSONResponse:
        # FastAPI's default error includes the rejected input, which may be a password/token.
        return JSONResponse(
            {"detail": "Invalid request; check the required fields"}, status_code=422
        )

    @app.exception_handler(Conflict)
    async def conflict(_: Request, error: Conflict) -> JSONResponse:
        return JSONResponse({"detail": str(error)}, status_code=409)

    @app.exception_handler(BudgetExceeded)
    async def budget_error(_: Request, error: BudgetExceeded) -> JSONResponse:
        return JSONResponse({"detail": str(error)}, status_code=429)

    @app.exception_handler(ValueError)
    async def value_error(_: Request, error: ValueError) -> JSONResponse:
        return JSONResponse({"detail": str(error)}, status_code=400)

    @app.exception_handler(KeyError)
    async def missing(_: Request, __: KeyError) -> JSONResponse:
        return JSONResponse({"detail": "Record not found"}, status_code=404)

    @app.exception_handler(ConnectionError)
    async def integration_error(_: Request, error: ConnectionError) -> JSONResponse:
        return JSONResponse({"detail": str(error)}, status_code=503)

    @app.exception_handler(ProviderUnavailable)
    async def ai_error(_: Request, error: ProviderUnavailable) -> JSONResponse:
        return JSONResponse({"detail": str(error)}, status_code=503)

    @app.exception_handler(httpx.HTTPError)
    async def network_error(_: Request, __: httpx.HTTPError) -> JSONResponse:
        return JSONResponse({"detail": "External service request failed"}, status_code=503)

    @app.get(base)
    @app.get(base + "/")
    def index() -> HTMLResponse:
        return HTMLResponse(
            (STATIC / "index.html").read_text(encoding="utf-8").replace("__ASSISTANT_BASE__", base)
        )

    app.mount(base + "/assets", StaticFiles(directory=STATIC), name="assistant-assets")

    @app.get(base + "/health")
    def health(response: Response) -> dict:
        with store.db() as db:
            db.execute("SELECT 1")
        heartbeat = store.get("system", "health", "worker")
        worker_ok = bool(
            heartbeat and time.time() - heartbeat["heartbeat"] < settings.worker_lease_seconds
        )
        if run_worker and not worker_ok:
            response.status_code = 503
        return {
            "status": "ok" if worker_ok or not run_worker else "not_ready",
            "worker": "running" if worker_ok else "starting",
            "version": settings.app_version,
        }

    @app.get(base + "/api/config")
    def public_config() -> dict:
        return {
            "name": settings.app_name,
            "base_path": base,
            "ai_available": settings.ai_enabled,
            "image_max_bytes": settings.max_image_bytes,
            "message_max_chars": settings.max_message_chars,
            "memory_max_chars": settings.max_memory_chars,
            "web_sources": settings.web_allowed_hosts,
            "live_actions_enabled": settings.live_actions_enabled,
            "disclosure": content("ui.json")["disclosure"],
            "ui": content("ui.json"),
        }

    @app.post(base + "/api/session")
    def session(request: Request, response: Response) -> dict:
        existing = store.authenticate(request.cookies.get(cookie, ""))
        if existing:
            return {"role": existing["role"]}
        ip = request.client.host if request.client else "unknown"
        store.rate("session:" + ip, *settings.rate_limits["session"])
        token, current = store.session()
        workflow.seed(current["scope"])
        set_cookie(response, token)
        return {"role": current["role"]}

    @app.post(base + "/api/login")
    def login(value: LoginRequest, request: Request, response: Response) -> dict:
        ip = request.client.host if request.client else "unknown"
        store.rate("login:" + ip, *settings.rate_limits["login"])
        if not secrets.compare_digest(
            value.password.encode(), settings.owner_password.get_secret_value().encode()
        ):
            raise HTTPException(401, "Incorrect owner password")
        token, current = store.session("owner")
        set_cookie(response, token)
        store.audit("merchant", "owner_login", {})
        return {"role": current["role"]}

    @app.post(base + "/api/logout")
    def logout(request: Request, response: Response, current: Actor) -> dict:
        token = request.cookies.get(cookie, "")
        with store.db() as db:
            db.execute(
                "DELETE FROM sessions WHERE digest=?", (hashlib.sha256(token.encode()).hexdigest(),)
            )
        response.delete_cookie(cookie, path=base)
        return {"signed_out": True}

    @app.get(base + "/api/workspace")
    def workspace(current: Actor) -> dict:
        scope = current["scope"]
        return {
            "role": current["role"],
            "rulebook": workflow.rulebook(scope),
            "tickets": store.list(scope, "ticket"),
            "orders": store.list(scope, "order"),
            "messages": list(reversed(store.list(scope, "message", settings.max_history_messages))),
            "memory": (store.get(scope, "memory", "preferences") or {}).get("text", ""),
            "jobs": store.jobs(scope),
            "audit": store.list(scope, "audit"),
            "setup": store.list(scope, "setup"),
            "connections": integrations.statuses() if current["role"] == "owner" else [],
            "budget": store.budget() if current["role"] == "owner" else None,
        }

    @app.post(base + "/api/chat")
    async def chat(value: ChatRequest, current: Actor) -> dict:
        if len(value.message) > settings.max_message_chars:
            raise ValueError("Message exceeds configured length")
        scope = current["scope"]
        store.rate("chat:" + scope, *settings.rate_limits["chat"])
        previous = list(reversed(store.list(scope, "message", settings.max_history_messages)))
        messages = [{"role": m["role"], "content": m["text"]} for m in previous]
        messages.append({"role": "user", "content": value.message})
        answer = await ai.complete(
            scope,
            "chat",
            {
                "rulebook": workflow.rulebook(scope),
                "storefront": content("storefront.json"),
                "synthetic": current["role"] != "owner",
                "user_preferences": store.get(scope, "memory", "preferences"),
                "retrieved_web_source": store.get(scope, "web_context", "latest"),
            },
            messages=messages,
            image=value.image,
        )
        store.put(
            scope,
            "message",
            secrets.token_hex(16),
            {
                "role": "user",
                "text": value.message,
                "time": time.time(),
                "image_attached": bool(value.image),
            },
        )
        store.put(
            scope,
            "message",
            secrets.token_hex(16),
            {"role": "assistant", "text": answer, "time": time.time()},
        )
        return {"answer": answer, "source": "claude"}

    @app.delete(base + "/api/memory")
    def erase(current: Actor) -> dict:
        store.erase(current["scope"])
        return {"erased": True}

    @app.put(base + "/api/memory")
    def remember(value: MemoryRequest, current: Actor) -> dict:
        if len(value.text) > settings.max_memory_chars:
            raise ValueError("Preferences exceed the configured limit")
        store.put(current["scope"], "memory", "preferences", value.model_dump())
        store.audit(current["scope"], "preferences_saved", {})
        return {"saved": True}

    @app.post(base + "/api/tickets")
    def ticket(value: TicketInput, current: Actor) -> dict:
        if current["role"] != "owner" and value.channel != "demo":
            raise HTTPException(403, "Live inbox tickets require owner access")
        return workflow.add_ticket(
            current["scope"], value, synthetic=current["role"] != "owner" or value.channel == "demo"
        )

    @app.post(base + "/api/tickets/{ticket_id}/recommend")
    async def recommend(ticket_id: str, value: RecommendationRequest, current: Actor) -> dict:
        ticket = store.get(current["scope"], "ticket", ticket_id)
        if ticket and not ticket["synthetic"]:
            await integrations.lookup_order(ticket)
        return await workflow.recommend(current["scope"], ticket_id, value.use_ai)

    @app.post(base + "/api/tickets/{ticket_id}/decision")
    async def decision(ticket_id: str, value: DecisionRequest, current: Actor) -> dict:
        if current["role"] == "owner":
            return await integrations.execute(ticket_id, value.version, value.decision)
        return workflow.decide_demo(current["scope"], ticket_id, value.version, value.decision)

    @app.get(base + "/api/tickets/{ticket_id}/handoff")
    def handoff(ticket_id: str, current: Actor) -> dict:
        return workflow.handoff(current["scope"], ticket_id)

    @app.put(base + "/api/rulebook")
    def rulebook(value: RulebookUpdate, current: Actor) -> dict:
        return workflow.save_rulebook(current["scope"], value.rulebook, value.version)

    @app.post(base + "/api/rulebook/draft")
    async def draft(value: ExamplesRequest, current: Actor) -> dict:
        result = await ai.complete(current["scope"], "rulebook", {"examples": value.examples})
        try:
            proposed = json.loads(result)
            if not isinstance(proposed, dict) or not isinstance(proposed.get("voice"), str):
                raise ValueError("Invalid rulebook draft")
        except ValueError as exc:
            raise ValueError(
                "AI draft could not be validated; active policies are unchanged"
            ) from exc
        store.put(current["scope"], "rulebook_draft", secrets.token_hex(16), proposed)
        return {"draft": proposed, "activated": False}

    @app.post(base + "/api/jobs")
    def schedule(value: ScheduleRequest, current: Actor) -> dict:
        if current["role"] != "owner" and value.kind in {"sync_inbox", "connection_check"}:
            raise HTTPException(403, "External jobs require owner access")
        store.rate("jobs:" + current["scope"], *settings.rate_limits["jobs"])
        if value.interval_seconds and value.interval_seconds < settings.worker_poll_seconds:
            raise ValueError("Recurring interval must exceed the worker polling interval")
        return {
            "job": store.enqueue(
                current["scope"], value.kind, value.delay_seconds, value.interval_seconds
            )
        }

    @app.post(base + "/api/setup")
    def setup(value: SetupEntry, current: Actor) -> dict:
        return store.put(
            current["scope"],
            "setup",
            secrets.token_hex(16),
            {**value.model_dump(), "time": time.time()},
        )

    @app.delete(base + "/api/jobs/{job_id}")
    def cancel(job_id: str, current: Actor) -> dict:
        store.cancel_job(current["scope"], job_id)
        return {"cancelled": True}

    @app.post(base + "/api/web")
    async def web(value: WebRequest, current: Actor) -> dict:
        store.rate("web:" + current["scope"], *settings.rate_limits["web"])
        result = await fetch_web(settings, value.url)
        store.put(
            current["scope"],
            "web_context",
            "latest",
            {
                "url": value.url,
                "text": result["text"][: settings.max_web_context_chars],
                "retrieved_at": time.time(),
                "untrusted_source": True,
            },
        )
        store.audit(current["scope"], "web_read", {"host": httpx.URL(value.url).host})
        return result

    @app.post(base + "/api/connections")
    def save_connection(value: ConnectionInput, _: Owner) -> dict:
        return integrations.save(value)

    @app.post(base + "/api/connections/{provider}/check")
    async def check_connection(provider: str, _: Owner) -> dict:
        if provider not in integrations.catalog:
            raise ValueError("Unsupported provider")
        return await integrations.check(provider)

    @app.post(base + "/api/connections/{provider}/read")
    async def read_connection(provider: str, _: Owner) -> dict:
        if provider not in integrations.catalog:
            raise ValueError("Unsupported provider")
        return {"data": await integrations.fetch_inbox(provider)}

    @app.get(base + "/api/export")
    def export(current: Actor) -> dict:
        return {
            "rulebook": workflow.rulebook(current["scope"]),
            "tickets": store.list(current["scope"], "ticket"),
            "audit": store.list(current["scope"], "audit"),
            "setup": store.list(current["scope"], "setup"),
        }

    register_mcp(app, settings, store, workflow, integrations)
    register_oauth(app, settings, store, integrations)
    return app
