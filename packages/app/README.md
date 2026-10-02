# Merchant app — `packages/app`

The backend of RegenAI: an embedded Shopify merchant app on Cloudflare Workers, plus four Shopify Functions written in Rust.

> **Status: development scaffold with open security release blockers.** A development build is deployed to a `workers.dev` URL; its review queue was empty when checked on 2026-09-24. Do not install on a store holding real data until SEC-01 to SEC-04 in [SECURITY-MODEL.md](../../docs/SECURITY-MODEL.md) are closed with tests.

## What it does

| Area | Route / module | Status |
|---|---|---|
| App install — OAuth start | `app/routes/auth.install.tsx` | Built |
| OAuth callback — shop-domain validation, `state` check, HMAC verification, token exchange | `app/routes/auth.callback.tsx` | Built; token encryption (SEC-01) and atomic state (SEC-03) outstanding |
| Product-claim review queue — intended for staff to review product-copy changes before publishing | `app/routes/admin.reviews.tsx` | Partial — read-only listing; no authentication or shop scoping yet (SEC-02); submission and approval flow planned |
| Shopify API helpers | `app/lib/shopify.ts` | Built |
| Webhooks (orders, app uninstall, mandatory privacy webhooks) | — | Planned |
| Shopify Functions | [`extensions/`](extensions/README.md) | Built; 47/47 unit tests pass |

## Stack

- React Router 7 (framework mode) on Cloudflare Workers via `@cloudflare/vite-plugin`
- Shopify Polaris for the admin UI
- Cloudflare D1 (SQLite) for app data; Workers KV for short-lived OAuth state
- Rust → WebAssembly (`wasm32-wasip1`) for Functions

## Data model

Defined in [`migrations/0001_initial.sql`](migrations/0001_initial.sql):

| Table | Purpose |
|---|---|
| `sessions` | Shopify OAuth session records |
| `oauth_tokens` | Per-shop offline access tokens (must be encrypted — SEC-01) |
| `clinician_review_queue` | Product-copy changes awaiting review, with status, reviewer and evidence metadata |
| `protocol_tracker` | Future adherence tracking (not used by any route yet) |

Every table carries a `shop` column; every query must filter by the authenticated shop.

## Commands

From `packages/app`:

| Task | Command |
|---|---|
| Local dev (Workers runtime, local D1/KV) | `npm run dev` |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Apply migrations locally | `npm run migrate:local` |
| Function unit tests | `cargo test --workspace` |
| Build one Function to WASM | `cargo build --release --target wasm32-wasip1 -p cart-contraindication` |

`npm run deploy` and `npm run migrate:remote` change live Cloudflare resources. Do not run them until environments are isolated (SEC-04) and the release is approved.

## Configuration

Worker bindings and non-secret variables live in `wrangler.toml`. Secrets (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, and — once SEC-01 lands — a token-encryption key) are set with `wrangler secret put`, never committed.

## Scaling notes

Workers scale automatically. D1 is single-threaded per database, so write-heavy work (webhook bursts) goes through a queue and idempotent batch workers. See [SCALABILITY.md](../../docs/SCALABILITY.md).

## Related

[Architecture](../../docs/ARCHITECTURE.md) · [Security model](../../docs/SECURITY-MODEL.md) · [ADR-021 — Workers + D1](../../docs/adr/ADR-021-custom-app-cf-workers-d1.md) · [ADR-008 — Functions over Scripts](../../docs/adr/ADR-008-shopify-functions-over-scripts.md)
