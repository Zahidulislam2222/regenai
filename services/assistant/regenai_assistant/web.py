"""Bounded live-web reads from the operator's explicit host allowlist."""

import ipaddress
import re
import socket
from urllib.parse import urlsplit

import httpx

from .config import Settings


async def fetch_web(settings: Settings, url: str) -> dict:
    parsed = urlsplit(url)
    if (
        parsed.scheme != "https"
        or parsed.hostname not in settings.web_allowed_hosts
        or parsed.username
        or parsed.password
        or parsed.port not in {None, 443}
    ):
        raise ValueError("This URL is outside the store's approved HTTPS knowledge sources")
    addresses = socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM)
    if any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
        raise ValueError("Private or reserved network destinations are not allowed")
    async with httpx.AsyncClient(
        timeout=settings.request_timeout_seconds, follow_redirects=False, trust_env=False
    ) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            if "text/" not in response.headers.get("content-type", ""):
                raise ValueError("Only text knowledge sources are supported")
            data = bytearray()
            async for chunk in response.aiter_bytes():
                data.extend(chunk)
                if len(data) > settings.web_max_bytes:
                    raise ValueError("Source exceeds the configured retrieval size limit")
    text = data.decode("utf-8", "replace")
    text = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return {
        "url": url,
        "text": re.sub(r"\s+", " ", text).strip(),
        "retrieved_live": True,
        "bytes": len(data),
    }
