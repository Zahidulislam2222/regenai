# ADR-021 — Custom app on Cloudflare Workers + D1 (not Fly.io / Railway)

**Status:** Accepted
**Date:** 2026-04-20 (Day 15)
**Layer:** `packages/app/` — merchant-facing Remix app (clinician review workflow, protocol engine, FDA claim audit, subscription management, B2B portal)

## Context

PROJECT_PLAN §4 describes a four-layer architecture. Layer 2 is the "Custom Shopify App" — an embedded merchant-admin app that needs:

- Persistent storage for OAuth tokens + per-shop state
- Session store for the embedded-app bounce flow
- Queue storage for the clinician review workflow (ADR-016 compliance-as-code gate)
- Protocol adherence tracker data (Phase 2 push notifications)
- HTTPS origin with a stable URL (registered with Shopify Partners as the app URL)
- Zero cost in Phase 1 (the $0 infrastructure constraint)
- A runtime compatible with modern JavaScript + React Router v7 SSR

Candidate runtimes:

## Decision

**Cloudflare Workers + D1 (SQLite at the edge) + Workers KV (sessions).**

Specifically:
- **Runtime** — Cloudflare Workers (V8 isolates, 100k requests/day free, 10ms CPU/req, 50ms startup)
- **Relational store** — Cloudflare D1 (5GB per DB free, SQLite semantics, migrations-first tooling via Wrangler)
- **Session / state cache** — Workers KV (100k reads/day + 1k writes/day free, eventual consistency acceptable for OAuth state tokens with 10-min TTL)
- **Deploy** — `wrangler deploy` via the existing authenticated Wrangler install
- **URL** — `regenai-app.regenai-workers.workers.dev` (auto-provisioned subdomain, Day-10 already in use for storefront)

## Alternatives rejected

1. **Fly.io + Postgres** — original Day-0 plan. Rejected because Fly.io free tier now requires a credit card on file (money-stop-and-warn trigger). Postgres paid tier starts at $3.94/mo. Two paid primitives we don't need.
2. **Railway** — $5/mo minimum. Rejected on cost.
3. **Supabase as both DB + app host** — Supabase's "Edge Functions" run on Deno Deploy and have a different mental model. Rejected to keep the runtime homogeneous with the storefront (both on Cloudflare Workers, single trace domain via Sentry).
4. **Shopify Managed App Proxy** — Shopify's hosted app surface. Rejected because it gives us no persistent storage of our own — everything is metafield-scoped, which can't model a review queue with audit history.
5. **AWS Lambda + RDS / DynamoDB** — AWS free tier has commerce restrictions + cold-start penalty. Rejected on both.
6. **Self-hosted on the user's machine** — ridiculous for a merchant app.

Cloudflare Workers + D1 wins on: already-authenticated toolchain (Wrangler OAuth from Day 0), free tiers sufficient for the Phase 1 traffic profile, SQLite semantics are easier to reason about than DynamoDB, same runtime as the storefront (shared observability story via ADR-015 Sentry tracing).

## Consequences

**Positive**
- $0 hosting, $0 storage, $0 KV. No money-stop-and-warn trigger.
- Shared toolchain with the storefront — one Wrangler install, one CF account, one deploy mental model.
- D1 migrations are git-tracked SQL files (`packages/app/migrations/NNNN_description.sql`) — matches the way we already think about schema evolution.
- KV + TTL is the perfect primitive for OAuth state tokens (10-min one-time-use).
- Single trace ID flows from browser → storefront Worker → app Worker → Shopify GraphQL (ADR-015).

**Negative**
- D1 is SQLite — no complex analytical queries. Day 29+ warehouse use cases route via BigQuery separately; that's fine.
- Workers CPU time cap (10ms free, 30s paid) can bite if we do synchronous work on the auth callback; current code only does hash verification + one Shopify token exchange, well under budget.
- No long-running background workers in Workers free tier. Scheduled tasks (nightly adherence reminders) use Worker Crons — still free.
- Cloudflare's own tooling is the only "blessed" deploy path. Means `wrangler` is a hard dep; there's no `docker run` fallback. Acceptable given we're already all-in on Cloudflare.

## Reversibility

Medium. The Remix app code itself is runtime-agnostic — React Router v7 + `createRequestHandler` works on Node / Cloudflare / Deno with adapter swaps. If we move off Workers we'd lose:
- D1 schema (portable via standard SQL to Postgres / Turso / LibSQL)
- KV usage pattern (rewritten against Redis / Postgres)
- `wrangler.toml` config (replaced by Docker / Kubernetes / Fly toml / Railway config)

The largest lock-in is D1 specifically — migrating to Postgres/Turso is ~1 day of work. No data lock-in per-se since the schema is just SQL.

## References

- PROJECT_PLAN §4 "Tech stack — 100% free-tier path" · Layer 2
- PROJECT_PLAN §11 Day 15 · "Custom Remix app scaffold on Cloudflare Workers"
- ADR-004 / ADR-011 — the storefront's matching Cloudflare Workers activation
- ADR-015 — Sentry distributed tracing spanning all layers
- ADR-016 — compliance-as-code (the clinician-review workflow is the first compliance gate running on this app)
- [Cloudflare Workers free tier](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 free tier](https://developers.cloudflare.com/d1/platform/pricing/)
