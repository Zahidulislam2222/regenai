# Merchant app — `packages/app`

The backend of RegenAI: a standalone Shopify merchant app on Cloudflare Workers, plus four Shopify Functions written in Rust.

> **Status: local security repair, not redeployed.** A prior development build exists at a `workers.dev` URL. The current authentication repair has local tests but needs remote secret/binding validation, migration, full review and release checks before deployment or use with real merchant data.

## What it does

| Area | Route / module | Status |
|---|---|---|
| App install — OAuth start | `app/routes/auth.install.tsx` | Built |
| OAuth callback — shop-domain validation, browser-bound single-use state, HMAC verification, token exchange | `app/routes/auth.callback.tsx` | Local repair built; remote migration and secret configuration pending |
| Product-claim review queue — intended for staff to review product-copy changes before publishing | `app/routes/admin.reviews.tsx`, `app/routes/admin.review-detail.tsx` | Local list/detail require opaque merchant session and bound shop query; submission and approval remain planned |
| Shopify API helpers | `app/lib/shopify.ts` | Built |
| Webhooks (orders, app uninstall, mandatory privacy webhooks) | — | Planned |
| Shopify Functions | [`extensions/`](extensions/README.md) | Built; 47/47 unit tests pass |

## Stack

- React Router 7 (framework mode) on Cloudflare Workers via `@cloudflare/vite-plugin`
- Shopify Polaris for the admin UI
- Cloudflare D1 (SQLite) for app data, single-use OAuth state and browser sessions
- Rust → WebAssembly (`wasm32-wasip1`) for Functions

## Data model

Defined in [`migrations/0001_initial.sql`](migrations/0001_initial.sql) and [`migrations/0002_merchant_auth.sql`](migrations/0002_merchant_auth.sql):

| Table | Purpose |
|---|---|
| `sessions` | Shopify OAuth session records |
| `oauth_tokens` | Per-shop offline access tokens; new writes use shop-bound AES-GCM ciphertext. Legacy plaintext rows require rotation before use. |
| `oauth_states` / `merchant_sessions` | Hashed, expiring browser-bound OAuth states and merchant sessions |
| `clinician_review_queue` | Product-copy changes awaiting review, with status, reviewer and evidence metadata |
| `protocol_tracker` | Future adherence tracking (not used by any route yet) |

Every table carries a `shop` column; every query must filter by the authenticated shop.

## Commands

From `packages/app`:

| Task | Command |
|---|---|
| Local dev (Cloudflare Vite runtime, local D1) | `npm run dev` |
| Merchant-auth focused tests | `npm test` |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Apply migrations locally | `npm run migrate:local` |
| Function unit tests | `cargo test --workspace` |
| Build one Function to WASM | `cargo build --release --target wasm32-wasip1 -p cart-contraindication` |

`npm run deploy` and `npm run migrate:remote` change live Cloudflare resources. Do not run them until environments are isolated (SEC-04) and the release is approved.

## Configuration

Worker bindings and non-secret variables live in `wrangler.toml`. Secrets (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_TOKEN_ENC_KEY`) are set with `wrangler secret put`, never committed. Preview and staging have no D1 binding until isolated databases are provisioned. The production encryption key is prepared privately but has not been configured remotely; the merchant app must not be redeployed before that and the migration are verified.

## Scaling notes

Workers scale automatically. D1 is single-threaded per database, so write-heavy work (webhook bursts) goes through a queue and idempotent batch workers. See [SCALABILITY.md](../../docs/SCALABILITY.md).

## Related

[Architecture](../../docs/ARCHITECTURE.md) · [Security model](../../docs/SECURITY-MODEL.md) · [ADR-021 — Workers + D1](../../docs/adr/ADR-021-custom-app-cf-workers-d1.md) · [ADR-008 — Functions over Scripts](../../docs/adr/ADR-008-shopify-functions-over-scripts.md)
