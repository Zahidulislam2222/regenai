"""Explicit service entry point; all runtime options come from Settings."""

import uvicorn

from .app import create_app
from .config import load_settings


def main() -> None:
    try:
        settings = load_settings()
    except ValueError:
        raise SystemExit(
            "Assistant configuration is invalid; check the private settings file"
        ) from None
    app = create_app(settings)
    server = uvicorn.Server(
        uvicorn.Config(
            app,
            host=settings.bind_host,
            port=settings.bind_port,
            access_log=False,
            server_header=False,
            proxy_headers=True,
            forwarded_allow_ips=settings.trusted_proxy_ips,
        )
    )
    app.state.server = server
    server.run()
    if getattr(app.state, "worker_failed", False):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
