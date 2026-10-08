# Standalone frontend release recovery

This directory describes the retained static React storefront deployment. The main public application now uses [Hydrogen](../hydrogen/README.md) and the Python assistant. Keep the earlier immutable static artifacts and release records as a recovery option.

## Build and routing

From the root, `npm run build:frontend` writes the standalone artifact. Copy `.env.example` to private `.env` and supply the approved immutable Nginx image, artifact directory, hostname and unused loopback port. Validate with `docker compose --env-file deploy/frontend/.env -f deploy/frontend/compose.yaml config`.

The checked-in Nginx route allowlist serves the supported collection, product, finder, journal and policy paths. Unknown extensionless routes render the application not-found view with HTTP 404. Missing assets, dotfiles and unsupported methods do not fall through to a successful page. Only GET and HEAD are accepted.

HTML uses no-store/no-transform and noindex headers. Hashed assets have immutable browser caching; other media revalidates. CSP permits the local application and Three.js scene. Logs retain method/status without query strings or referrers. Use non-root, read-only, capability-restricted containers.

## Controlled restoration

Keep the artifact, image digest, private environment and matching manifest together. A static restoration is a frontend-only recovery and does not itself replace the assistant. Prepare and validate a local route diff, prove current-live parity before promotion, preserve the shared Caddy configuration, and check the public application after selecting the retained artifact. Old credentials may need rotation before use.

Do not delete previous releases or perform global Docker cleanup during a deployment. [Release guide](../../docs/RELEASE.md) · [Release history](../../docs/FRONTEND-DEPLOYMENT.md)
