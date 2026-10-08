"""Browser-bound OAuth state with verified Shopify signatures and Google consent."""

import hashlib
import hmac
import secrets
import time
from urllib.parse import urlencode

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse

from .config import Settings, content
from .integrations import ConnectionInput, Integrations
from .store import Conflict, Store


def register_oauth(
    app: FastAPI, settings: Settings, store: Store, integrations: Integrations
) -> None:
    protocol = content("oauth.json")
    base = settings.base_path
    session_cookie = "regenai_assistant_session"
    callback_cookie = "regenai_assistant_oauth_browser"

    def browser_token(request: Request) -> str:
        return request.cookies.get(session_cookie, "") or request.cookies.get(callback_cookie, "")

    def owner(request: Request) -> dict:
        current = store.authenticate(browser_token(request))
        if not current or current["role"] != "owner":
            raise HTTPException(403, "Owner browser session required")
        return current

    @app.get(base + "/oauth/{provider}/start")
    def start(provider: str, request: Request, shop: str = "") -> RedirectResponse:
        current = owner(request)
        if provider not in {"shopify", "gmail", "calendar"}:
            raise ValueError("Unsupported OAuth provider")
        state = secrets.token_urlsafe(32)
        state_id = hashlib.sha256(state.encode()).hexdigest()
        cookie_digest = hashlib.sha256(browser_token(request).encode()).hexdigest()
        record = {
            "provider": provider,
            "browser": cookie_digest,
            "expires": time.time() + protocol["state_seconds"],
            "used": False,
        }
        callback = settings.public_origin + base + "/oauth/" + provider + "/callback"
        params = {"state": state, "redirect_uri": callback, "response_type": "code"}
        if provider == "shopify":
            if (
                not settings.shopify_client_id
                or not settings.shopify_client_secret.get_secret_value()
            ):
                raise ValueError("Configure the limited support app's OAuth credentials first")
            host = integrations.validate_url("shopify", "https://" + shop)
            record["shop"] = shop
            params.update(
                client_id=settings.shopify_client_id, scope=",".join(settings.shopify_scopes)
            )
            url = host + protocol["shopify_authorize_path"]
        else:
            if (
                not settings.google_client_id
                or not settings.google_client_secret.get_secret_value()
            ):
                raise ValueError("Configure the Google OAuth client and callback first")
            params.update(
                client_id=settings.google_client_id,
                scope=" ".join(protocol[provider]["scopes"]),
                access_type="offline",
                prompt="consent",
            )
            url = protocol["google_authorize_url"]
        store.put(current["scope"], "oauth_state", state_id, record)
        response = RedirectResponse(url + "?" + urlencode(params), status_code=302)
        response.set_cookie(
            callback_cookie,
            browser_token(request),
            httponly=True,
            secure=settings.secure_cookies,
            samesite="lax",
            path=base + "/oauth",
            max_age=protocol["state_seconds"],
        )
        return response

    @app.get(base + "/oauth/{provider}/callback")
    async def callback(
        provider: str, request: Request, state: str = "", code: str = "", shop: str = ""
    ) -> RedirectResponse:
        current = owner(request)
        state_id = hashlib.sha256(state.encode()).hexdigest()
        record = store.get(current["scope"], "oauth_state", state_id)
        cookie_digest = hashlib.sha256(browser_token(request).encode()).hexdigest()
        if (
            not record
            or record["used"]
            or record["expires"] < time.time()
            or record["provider"] != provider
            or record["browser"] != cookie_digest
            or not code
        ):
            raise HTTPException(400, "OAuth callback state is invalid or expired")
        credentials = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.public_origin + base + "/oauth/" + provider + "/callback",
        }
        if provider == "shopify":
            if shop != record["shop"]:
                raise HTTPException(400, "Shopify callback shop mismatch")
            host = integrations.validate_url(provider, "https://" + shop)
            supplied_hmac = request.query_params.get("hmac", "")
            pairs = sorted(
                (key, value)
                for key, value in request.query_params.multi_items()
                if key not in {"hmac", "signature"}
            )
            digest = hmac.new(
                settings.shopify_client_secret.get_secret_value().encode(),
                urlencode(pairs).encode(),
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(supplied_hmac, digest):
                raise HTTPException(400, "Shopify callback signature is invalid")
            credentials.update(
                client_id=settings.shopify_client_id,
                client_secret=settings.shopify_client_secret.get_secret_value(),
            )
            token_url = host + protocol["shopify_token_path"]
        elif provider in {"gmail", "calendar"}:
            host = integrations.catalog[provider]["base_url"]
            credentials.update(
                client_id=settings.google_client_id,
                client_secret=settings.google_client_secret.get_secret_value(),
            )
            token_url = integrations.catalog[provider]["oauth_token_url"]
        else:
            raise HTTPException(400, "Unsupported callback provider")
        # Consume verified browser state before token exchange; replays cannot create credentials.
        try:
            store.put(
                current["scope"],
                "oauth_state",
                state_id,
                {**record, "used": True},
                record["version"],
            )
        except Conflict as exc:
            raise HTTPException(400, "OAuth callback has already been consumed") from exc
        async with httpx.AsyncClient(
            timeout=settings.request_timeout_seconds, follow_redirects=False, trust_env=False
        ) as client:
            response = await client.post(token_url, data=credentials)
        if response.status_code != 200:
            raise HTTPException(
                400, "OAuth exchange failed; restart consent after checking app settings"
            )
        body = response.json()
        if not body.get("access_token"):
            raise HTTPException(400, "OAuth provider did not return an access token")
        integrations.save(
            ConnectionInput.model_validate(
                {
                    "provider": provider,
                    "base_url": host,
                    "access_token": body["access_token"],
                    "refresh_token": body.get("refresh_token", ""),
                    "client_id": credentials["client_id"],
                    "client_secret": credentials["client_secret"],
                    "expires_at": time.time() + body["expires_in"] if body.get("expires_in") else 0,
                }
            )
        )
        store.audit("merchant", "oauth_connected", {"provider": provider})
        redirect = RedirectResponse(settings.public_origin + base, status_code=303)
        redirect.delete_cookie(callback_cookie, path=base + "/oauth")
        return redirect
