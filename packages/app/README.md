# Merchant app — `packages/app`

The backend of RegenAI: a standalone Shopify merchant app on Cloudflare Workers, plus three deployable Shopify Functions written in Rust. The separate discount-stacking rule crate requires a supported API redesign before deployment.

> **Status: local security and privacy repair, not redeployed.** The prior development Worker's production and preview `workers.dev` URLs were disabled and verified on 2026-10-04. Authentication, uninstall and privacy webhook paths passed local tests and loopback HTTP checks. Isolated remote data, secrets, migrations, Shopify subscriptions, full review and release checks remain required before merchant use.

## What it does

| Area | Route / module | Status |
|---|---|---|
| App install — OAuth start | `app/routes/auth.install.tsx` | Built |
| OAuth callback — shop-domain validation, browser-bound single-use state, HMAC verification, token exchange | `app/routes/auth.callback.tsx` | Local repair built; remote migration and secret configuration pending |
| Product-claim review queue — intended for staff to review product-copy changes before publishing | `app/routes/admin.reviews.tsx`, `app/routes/admin.review-detail.tsx` | Local list/detail require opaque merchant session and bound shop query; submission and approval remain planned |
| Shopify API helpers | `app/lib/shopify.ts` | Built |
| App uninstall webhook | `app/routes/webhooks.app-uninstalled.ts` | Locally built and HTTP-tested; not subscribed or deployed |
| Privacy webhooks and merchant queue | `app/routes/webhooks.privacy.ts`, `app/routes/admin.privacy.tsx` | Three topics built and locally HTTP-tested; subscriptions are configured privately but unreleased, and remote delivery unverified |
| Orders | — | Planned |
| Shopify Functions | [`extensions/`](extensions/README.md) | Three current-schema crates in an inactive draft; store activation unverified |

## Stack

- React Router 7 (framework mode) on Cloudflare Workers via `@cloudflare/vite-plugin`
- Shopify Polaris for the admin UI
- Cloudflare D1 (SQLite) for app data, single-use OAuth state and browser sessions
- Rust → WebAssembly (`wasm32-unknown-unknown`) for Functions

## Data model

Defined in [`migrations/`](migrations/), including six ordered migrations through `0006_privacy_resolution.sql`:

| Table | Purpose |
|---|---|
| `sessions` | Shopify OAuth session records |
| `oauth_tokens` | Per-shop offline access tokens; new writes use shop-bound AES-GCM ciphertext. Legacy plaintext rows require rotation before use. |
| `oauth_states` / `merchant_sessions` | Hashed, expiring browser-bound OAuth states and merchant sessions |
| `clinician_review_queue` | Product-copy changes awaiting review, with status, reviewer and evidence metadata |
| `protocol_tracker` | Future adherence tracking (not used by any route yet) |
| `webhook_deliveries` | Signed delivery IDs and payload digests for idempotency; no raw webhook payloads stored |
| `privacy_requests` | Shop-scoped action queue; email-only contact is encrypted until handled |

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
| Build one Function to WASM | `cargo build --release --target wasm32-unknown-unknown -p cart-contraindication` |

`npm run deploy` and `npm run migrate:remote` change live Cloudflare resources. Do not run them until environments are isolated (SEC-04) and the release is approved.

## Configuration

Worker bindings and non-secret variables live in `wrangler.toml`; typed limits live in `app/lib/merchant-config.ts`. Secrets (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_TOKEN_ENC_KEY`) are set with `wrangler secret put`, never committed. Preview and staging have no D1 binding until isolated databases are provisioned. The production encryption key is prepared privately but has not been configured remotely; the merchant app must not be redeployed before that and all six migrations are verified. The ignored Shopify app config now declares relative uninstall and privacy webhook subscriptions, but its application URL still points to Shopify's default page; no app version release or real delivery has been made.
The tracked [`shopify.app.example.toml`](shopify.app.example.toml) documents the required subscriptions and safe placeholder URLs for a fresh clone. The real linked app configuration remains ignored.

## Scaling notes

The Worker platform scales request execution within its documented limits; application storage and dependency quotas still constrain throughput. D1 is single-threaded per database; a durable queue and burst handling remain planned for higher webhook volume. See [SCALABILITY.md](../../docs/SCALABILITY.md).

## Publication boundary

The deployed Python support backend is a separate service. Publishing this repository does not activate this merchant Worker, its draft Functions, subscriptions or remote migrations. The optional Workers workflow requires manual dispatch and explicit repository opt-in.

## Related

[Architecture](../../docs/ARCHITECTURE.md) · [Security model](../../docs/SECURITY-MODEL.md) · [ADR-021 — Workers + D1](../../docs/adr/ADR-021-custom-app-cf-workers-d1.md) · [ADR-008 — Functions over Scripts](../../docs/adr/ADR-008-shopify-functions-over-scripts.md)
