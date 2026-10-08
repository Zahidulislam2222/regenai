# RegenAI Python support assistant

Python 3.12 / FastAPI service for the live Hydrogen storefront. Customer chat and Support Studio use the storefront's cream, navy and cobalt palette and local fonts. The service provides encrypted conversation memory, rulebooks, recommendations, version-bound approvals, complete human handoff bundles, setup logs and durable jobs.

Shopify support-app token renewal and Gmail offline-grant refresh, dedicated-label reads and restart persistence have been verified. Gmail uses the existing installed-app client; Google Testing consent can expire after seven days. Two authorized model checks passed Spanish memory/image understanding and the $89 recommendation. Real refunds and outbound customer messages remain disabled until their complete external flow is verified.

## Install and configure

Install `python -m pip install -e '.[dev]'` in a private virtual environment. Copy `.env.example` to a private environment file, generate a Fernet key and distinct owner/operator/MCP credentials, configure origin and database path, and select the model/pricing before enabling AI. All runtime values pass through `regenai_assistant/config.py`; prompts, policy and connector data are maintained package files.

Launch from the service directory with `python -m dotenv -f .env run -- regenai-assistant` after installing the optional environment-file helper, or have your process manager inject the environment and run `regenai-assistant`. The helper is not a production dependency. Keep secrets out of command arguments and logs.

## Verification

```bash
python -m pytest -q
python -m ruff check .
python -m mypy --no-incremental regenai_assistant
python -m bandit -r regenai_assistant -q
python -m pip wheel --no-deps . --wheel-dir dist
python sync_theme.py --check
```

Committed automated tests cover configuration/secret regressions, authentication, workspace isolation, budget reservations, retention, durable leases, approvals, action reconciliation and connector request bounds. The GitHub assistant workflow runs source gates without model credentials or paid calls. Personal manual tools remain in ignored project storage.

## Deploy and recover

Build with the Dockerfile's explicit verified `PYTHON_IMAGE` digest. The context excludes credentials, tests and recovery files. Deploy only the tested image with a private runtime environment, loopback listener and durable data directory owned by UID 10001. Keep the encryption key recoverable separately from database backups; use SQLite's consistent backup API for the WAL database. Preserve budget ledgers, audit records and ambiguous action locks during restore.

The current database is for a single client deployment. A shared multi-client or horizontally scaled assistant requires the database, queue and authorization changes in the [capacity plan](../../docs/SCALABILITY.md), not extra replicas pointed at local SQLite.

[Acceptance](../../docs/ASSISTANT-SPEC.md) · [Operator/client installation](../../docs/ASSISTANT.md) · [Release](../../docs/RELEASE.md) · [Privacy](../../docs/PRIVACY.md) · [Claude client](client/INSTALL.md)
