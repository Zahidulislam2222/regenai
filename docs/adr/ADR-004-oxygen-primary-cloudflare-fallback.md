# ADR-004 — Oxygen primary hosting + Cloudflare Pages fallback documented

**Status:** Accepted  **Date:** 2026-04-20 (Day 3)  **Supersedes:** —

## Context

RegenAI storefront needs global-edge hosting with:
- Sub-100ms TTFB from major metros (US / CA / UK / EU / AU — our 5 markets)
- Zero-cost for Phase 1 portfolio traffic
- Deploy-from-git pipeline (PR preview URLs required)
- Integration with Shopify CDN (product images, checkout domain)
- Hydrogen-native caching + stale-while-revalidate
- A fallback plan if the primary provider has sustained outages or unexpected paywalls

## Decision

**Primary: Oxygen** (Shopify's global edge hosting for Hydrogen, free on Partner Plus Dev Stores).
**Documented fallback: Cloudflare Pages with Workers.** No code changes required to swap — the Hydrogen build output is Worker-compatible. Fallback is fire-drill-ready, not active.

## Alternatives rejected

1. **Vercel** — free hobby tier has real TOS restrictions for commerce (no commercial use). Paid is $20/mo minimum. Oxygen is free + commerce-licensed.
2. **Cloudflare Pages as primary** — no Hydrogen-specific optimizations (Shopify CDN preconnect, cart session handling). We use CF as fallback + for Workers (custom app D15+).
3. **Netlify** — same Vercel-style commercial restrictions on free tier.
4. **Self-host on Fly.io** — originally planned; ruled out Day 0 (free tier requires credit card, swap to CF Workers for custom app).
5. **AWS Lambda@Edge** — overkill and costly for the storefront's traffic profile.

## Consequences

**+** $0 primary hosting. Free CI deploys.
**+** Oxygen auto-handles Shopify CDN, checkout domain routing, cart cookies.
**+** CF Pages fallback means a Shopify Oxygen outage isn't an existential risk — redeploy via `wrangler pages` from the same build artifact.
**−** Oxygen requires a Shopify "Hydrogen Storefront" resource, created via Partners Dashboard (browser, interactive). First-time setup is a user-handoff step (tracked in BUILD-LOG D1.5).
**−** Oxygen free tier has traffic caps at "some undocumented amount" — per Shopify docs, sufficient for development + portfolio demo. For a real launch with real traffic, we'd convert the Partner dev store to a paid Plus plan (out-of-scope Phase 1).

**Reversibility:** High. Swapping to CF Pages as primary is a `wrangler.toml` + GH Actions workflow change; no code changes.
