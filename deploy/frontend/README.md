# Standalone recovery frontend preview

This packet serves only the static React Router portfolio/demo build. It does not run Hydrogen SSR, Shopify account/cart APIs, live checkout, payments, or backend routes. The demo's bag and product data remain local browser fixtures; this deployment makes no real-commerce or medical claims.

## Build and local configuration

From the repository root, run `npm run build:frontend`. Vite writes `packages/storefront/dist/frontend`. Copy `.env.example` to the ignored `deploy/frontend/.env` and set `FRONTEND_NGINX_IMAGE` to the supervisor-approved immutable `image@sha256:...` reference, `FRONTEND_BIND_PORT` to the allocated loopback port, and `FRONTEND_HOSTNAME` to the allocated site name. On a host, set `FRONTEND_DIST_PATH` to the absolute path of the versioned release artifact. `FRONTEND_BIND_ADDRESS` must remain loopback because Caddy is the public listener. Compose fails when required release values are missing.

Validate configuration with `docker compose --env-file deploy/frontend/.env -f deploy/frontend/compose.yaml config` from the repository root. After the supervisor approves the candidate and confirms the built artifact, their local Docker check should verify the Nginx config, non-root/read-only/capability settings, health endpoint, route/status matrix, assets and browser rendering. No remote deployment is part of this packet.

## Routing and headers

The recognized preview paths are `/`, `/collections/all`, `/search`, `/products/pulse`, `/products/roller`, `/products/bands`, `/products/wrap`, `/products/balls`, `/products/sensor`, `/quiz`, `/cart`, `/about`, `/evidence`, `/policies/privacy`, and `/policies/delivery`. Each serves `index.html` with HTTP 200 so the existing client router can render its page. Other extensionless client paths internally receive `index.html` with HTTP 404, allowing the app's not-found screen while keeping the HTTP status truthful. Unknown product IDs therefore receive the app's not-found screen with status 404. Missing asset paths, dotfiles and unsupported methods do not fall back to the SPA. Only GET and HEAD are accepted.

All responses include `X-Robots-Tag: noindex`; HTML uses `no-store, no-transform`; hashed Vite assets use immutable one-year caching; public media revalidates. CSP permits same-origin scripts/assets and local Three.js rendering, including React's inline style attributes; it does not permit inline scripts or external connections. Nginx logs only status and method, and suppresses routine missing-file details so query strings and referrers are not written to logs.

## Versioned release and rollback

Build each candidate into a unique release directory and set that release's private `FRONTEND_DIST_PATH` to its artifact. Keep the prior artifact, private environment file, image digest and test record intact. Promote by selecting the candidate release values and recreating only the frontend Compose service; validate health and public HTTP/browser behavior through the already-managed Caddy site. Roll back by restoring the previous release's private environment values and Compose service, then repeat the same health and public checks. Do not change the shared Caddy main configuration in this packet; `Caddyfile.template` is a site snippet with Caddy environment substitutions. Render/adapt the final site locally with the supervisor-provided private environment before it is reviewed or loaded by the shared Caddy process.

Do not delete old releases or perform global Docker cleanup as part of promotion or rollback. The supervisor owns live drift checks, shared Caddy integration, DNS, credentials, remote mutation and approval.
