"""Bounded provider calls. The model cannot execute support actions."""

import base64
import json
from decimal import Decimal
from typing import Any

import httpx

from .config import Settings, content
from .store import Store


class ProviderUnavailable(Exception):
    pass


class AI:
    def __init__(self, settings: Settings, store: Store):
        self.settings = settings
        self.store = store
        self.prompts = content("prompts.json")

    def image(self, data_url: str) -> str:
        types = {
            "data:image/png;base64,": b"\x89PNG\r\n\x1a\n",
            "data:image/jpeg;base64,": b"\xff\xd8\xff",
            "data:image/webp;base64,": b"RIFF",
        }
        prefix = next((p for p in types if data_url.startswith(p)), None)
        if prefix is None:
            raise ValueError("Use a PNG, JPEG or WebP image")
        try:
            data = base64.b64decode(data_url[len(prefix) :], validate=True)
        except ValueError as exc:
            raise ValueError("Invalid image encoding") from exc
        if not data.startswith(types[prefix]) or len(data) > self.settings.max_image_bytes:
            raise ValueError("Invalid image or image exceeds the configured size limit")
        return data_url

    async def complete(
        self,
        scope: str,
        purpose: str,
        context: dict,
        messages: list[dict] | None = None,
        image: str | None = None,
        schema: dict | None = None,
    ) -> str:
        if not self.settings.ai_enabled:
            raise ProviderUnavailable(self.prompts["offline"])
        system = self.prompts[purpose] + "\nVERIFIED CONTEXT:\n" + json.dumps(context)
        payload_messages: list[dict[str, Any]] = [{"role": "system", "content": system}]
        if messages:
            payload_messages.extend(messages)
        if image:
            self.image(image)
            latest = payload_messages[-1]
            latest["content"] = [
                {"type": "text", "text": latest["content"]},
                {"type": "image_url", "image_url": {"url": image}},
            ]
        estimate_messages = json.dumps(
            [
                {**m, "content": m["content"][0]["text"] + "[image]"}
                if isinstance(m["content"], list)
                else m
                for m in payload_messages
            ]
        ).encode()
        # Byte upper bound for text tokenization, plus a conservative vision allowance.
        if len(estimate_messages) > self.settings.max_prompt_bytes:
            raise ValueError("Context is too large for the configured AI budget")
        input_tokens = len(estimate_messages) + (self.settings.image_token_reserve if image else 0)
        reserved = (
            Decimal(input_tokens) * self.settings.input_price_per_million
            + Decimal(self.settings.max_output_tokens) * self.settings.output_price_per_million
        ) / Decimal(1000000)
        reservation = self.store.reserve(scope, reserved)
        payload: dict[str, Any] = {
            "model": self.settings.ai_model,
            "messages": payload_messages,
            "max_tokens": self.settings.max_output_tokens,
            "provider": {"data_collection": "deny"},
        }
        if schema:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": {"name": purpose, "strict": True, "schema": schema},
            }
        actual = None
        try:
            async with httpx.AsyncClient(
                timeout=self.settings.request_timeout_seconds,
                follow_redirects=False,
                trust_env=False,
            ) as client:
                response = await client.post(
                    self.settings.ai_base_url.rstrip("/") + "/chat/completions",
                    json=payload,
                    headers={
                        "Authorization": "Bearer " + self.settings.ai_api_key.get_secret_value(),
                        "HTTP-Referer": self.settings.public_origin,
                        "X-Title": self.settings.app_name,
                    },
                )
            if response.status_code in {401, 402, 403, 429}:
                raise ProviderUnavailable("AI access, credits or rate limit needs owner attention")
            response.raise_for_status()
            result = response.json()
            usage = result.get("usage", {})
            if usage.get("cost") is not None:
                actual = Decimal(str(usage["cost"]))
            elif "prompt_tokens" in usage and "completion_tokens" in usage:
                actual = (
                    Decimal(usage["prompt_tokens"]) * self.settings.input_price_per_million
                    + Decimal(usage["completion_tokens"]) * self.settings.output_price_per_million
                ) / Decimal(1000000)
            answer = result["choices"][0]["message"]["content"]
            if not isinstance(answer, str) or not answer.strip():
                raise ProviderUnavailable("The AI provider returned no answer")
            self.store.audit(
                scope,
                "ai_response",
                {"purpose": purpose, "cost_usd": str(actual) if actual else None},
            )
            return answer
        except (httpx.HTTPError, KeyError, ValueError, IndexError) as exc:
            raise ProviderUnavailable(
                "AI request failed; the request was not automatically retried"
            ) from exc
        finally:
            self.store.settle(reservation, actual)
