# RegenAI Python support assistant

Python 3.12 / FastAPI service for the existing Hydrogen storefront. Customer chat and the support console use the storefront's design tokens and local fonts. The public workflow uses workspace tickets and orders; it cannot issue real refunds or send customer messages.

See [the acceptance contract](../../docs/ASSISTANT-SPEC.md) and [the operator guide](../../docs/ASSISTANT.md) for supported connections, installation, validation and recovery.

Install `python -m pip install -e '.[dev]'`. Copy `.env.example` to a private `.env`, generate a Fernet key and distinct owner, operator and MCP credentials, then set an explicit provider model before enabling AI. The central settings file supplies every runtime default. Keep secrets out of source and shell arguments. Launch with `python -m dotenv -f .env run -- regenai-assistant` from the project root, with a configured database path.

Run `pytest services/assistant/tests -q`, `ruff check services/assistant`, `mypy services/assistant/regenai_assistant`, `bandit -r services/assistant/regenai_assistant -ll` and `python services/assistant/sync_theme.py --check`. Genuine CI tests are committed; private manual tooling belongs in the ignored project memory directory.

Build with the Dockerfile's explicit `PYTHON_IMAGE` digest. The Docker context excludes credentials, tests and recovery records. Deploy the locally verified image with `compose.yaml`, loopback ports, a private runtime env file and a durable data directory owned by UID 10001. Deployment settings intentionally have no implicit provider image or environment fallback.
