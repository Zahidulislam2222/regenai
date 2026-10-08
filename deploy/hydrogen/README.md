# Hydrogen container deployment

The public storefront uses the Node Hydrogen adapter behind Caddy and Cloudflare. The Python assistant is routed on the same origin. The earlier standalone static artifact is retained for recovery; it is no longer the main application.

## Local build and configuration

`scripts/prepare-hydrogen-context.mjs` copies tracked allowlisted source and manifests into the ignored context. It excludes credentials, private recovery files, tests and generated output. Select a verified official Node image digest through the private Compose environment. Runtime credentials enter through a separate ignored environment file.

Copy `.env.example` to ignored `.env`, set the immutable image, allocated loopback port and private runtime file, then run from the repository root:

```bash
node scripts/prepare-hydrogen-context.mjs
docker compose --env-file deploy/hydrogen/.env -f deploy/hydrogen/compose.yaml config --quiet
docker compose --env-file deploy/hydrogen/.env -f deploy/hydrogen/compose.yaml build
```

The runtime file sets canonical origin and the required Shopify variables. Keep public ordering and Customer Account disabled unless their intended release has passed acceptance. The container uses a non-root user, read-only filesystem, dropped capabilities, bounded resources and `/readyz` health checks. The versioned product model has a precompressed sidecar; private HTML/cart/account responses keep separate cache rules.

## Promotion and recovery

Inventory the existing deployment and compare active source, images, environment and Caddy bytes before any edit or upload. Reconcile live-ahead changes locally. Freeze a new versioned package and manifest, retain the previous release, validate the candidate at an unused loopback port, then promote only the reviewed Caddy site snippet. Preserve the shared main configuration and other applications.

Check public routes, closed-ordering behavior, model assets and same-origin assistant routing after promotion. Recompare every uploaded file and the exact image/runtime artifacts. Never infer parity from a successful restart. Restore the previous route and compatible credentials/data on failure; never roll back to expired secrets.

[Release procedure](../../docs/RELEASE.md) · [Deployment evidence](../../docs/FRONTEND-DEPLOYMENT.md) · [Reliability](../../docs/RELIABILITY.md)
