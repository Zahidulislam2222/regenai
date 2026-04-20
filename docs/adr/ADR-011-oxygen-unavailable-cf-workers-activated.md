# ADR-011 — Oxygen unavailable on dev stores; Cloudflare Workers fallback activated

**Status:** Accepted
**Date:** 2026-04-20 (Day 10 remediation)
**Amends:** ADR-004 (Oxygen primary + Cloudflare Pages fallback documented)
**Supersedes:** The "Primary: Oxygen" clause of ADR-004

## Context

ADR-004 was written Day 3 asserting Oxygen would be the primary storefront host, on the premise that the `regenai` Partner Plus Dev Store qualified for free Oxygen hosting. That premise was wrong.

During Day-10 remediation the user attempted to create a Hydrogen storefront on the dev store. Three independent surfaces confirmed Oxygen is gated:

1. Shopify admin → Sales channels → Hydrogen displays *"The Hydrogen sales channel isn't available on your plan. Compare plans."*
2. Admin GraphQL `hydrogenStorefrontCreate` mutation returns `ACCESS_DENIED` with the required-access message *"user must have full access to apps or access to the Hydrogen channel"* — both from a regular Admin API token and from a Shopify-CLI-issued session as the store owner.
3. Admin GraphQL `hydrogenStorefronts` query returns the same `ACCESS_DENIED`.

Research across the official Hydrogen GitHub discussions, the Shopify developer community forums, and the Hydrogen docs confirms this is explicit Shopify policy:

> *"The Hydrogen Channel (Oxygen) isn't available to development stores, but you could generate a Storefront API key from a development store to run Hydrogen locally or somewhere other than Oxygen."*
> — Shopify/hydrogen Discussion #2561

> *"You can create access tokens for your own Shopify store by installing the Hydrogen sales channel, which includes built-in support for Oxygen, Shopify's global edge hosting platform, or install the **Headless sales channel** to host your Hydrogen app anywhere."*
> — Hydrogen docs, Storefronts section

The Plus-preview flag on a dev store grants B2B, Markets, Functions, Checkout Extensibility, Multiple Business Entities — but not Hydrogen channel / Oxygen hosting. Oxygen requires a production Plus subscription (~$2,000+/mo), which is explicitly out-of-scope per the $0 infrastructure budget.

## Decision

**Activate the fallback that ADR-004 pre-authorised.** Specifically:

1. **Hosting platform** — Cloudflare Workers. Wrangler authenticated via OAuth at Day 0 with `workers (write)` scope; account id `f523a94f3089b05b1943314df3fd2624`. Free tier — 100k requests/day, 10 ms CPU time/req — comfortably sufficient for Phase 1 portfolio traffic.
2. **Storefront API tokens** — install the Shopify **Headless** sales channel (not Hydrogen) on `regenai.myshopify.com`. Creates a storefront resource that mints the public + private Storefront API tokens Hydrogen needs. Free. Same tokens work from any hosting target.
3. **Build pipeline** — unchanged. `shopify hydrogen build` produces a Worker-compatible bundle (`dist/server/index.js` + `dist/client/` assets). `wrangler deploy` ships that bundle to CF Workers. No code changes to the Hydrogen app.
4. **Deploy workflows** — `deploy-preview.yml`, `deploy-staging.yml`, `deploy-production.yml` target Workers via `cloudflare/wrangler-action@v3` instead of Oxygen's `shopify/hydrogen-deploy` action.
5. **Environment secrets** — `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` + `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` + `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` replace `OXYGEN_DEPLOYMENT_TOKEN` in GH Secrets. CF API token minted in the Cloudflare dashboard (user handoff).
6. **Lighthouse CI** — re-gates on `CLOUDFLARE_API_TOKEN` availability (was previously gated on `OXYGEN_DEPLOYMENT_TOKEN`). Runs against the Workers preview URL.

## Alternatives rejected

1. **Convert `regenai.myshopify.com` to a paid Plus subscription.** Costs $2,000+/month. Violates the $0 infrastructure constraint. Rejected.
2. **Create a new production Plus store.** Same paywall. Rejected.
3. **Vercel** — free tier TOS forbids commercial use; Hydrogen on Vercel for a commerce demo is marginal. Rejected.
4. **Netlify** — same Vercel-style commercial restrictions. Rejected.
5. **Stay on mini-Oxygen for local dev only, skip public hosting entirely.** Works for code review but kills any browser-accessible demo, Lighthouse-CI against a real URL, or shareable portfolio link. Rejected.
6. **GitHub Pages** — static only, no SSR, no edge loaders. Incompatible with Hydrogen SSR. Rejected.

Cloudflare Workers wins on: free tier sufficiency, already-authenticated Wrangler, Hydrogen bundle compatibility, global edge, commercial-use-allowed TOS.

## Consequences

**Positive**
- $0 hosting preserved. No paywall surprise.
- Code path unchanged. All Days 1–10 work ships identically.
- ADR-004's fallback clause proves its value — no panicked redesign.
- Removes the Oxygen dependency that had been blocking Lighthouse CI + deploy workflows since Day 2.

**Negative**
- One new ADR and one config file (`wrangler.toml`) added.
- Shopify CDN preconnect hint is still wired (no harm), but Oxygen-specific optimisations like automatic cart cookie handling are no-ops on Workers. No observable impact in dev/staging.
- CI deploy workflows rewire required (one-off edit).
- `OXYGEN_DEPLOYMENT_TOKEN` GH Secret becomes vestigial. Left in place until Phase 2 gate review.

## Reversibility

High. If the project ever upgrades to a production Plus store (Phase 3 white-label pivot, for example), re-activating Oxygen is a one-commit change: install Hydrogen channel, mint Oxygen deployment token, revert deploy workflows to `shopify/hydrogen-deploy`, re-run. Hydrogen code is source-compatible across both targets.

## References

- [Shopify/hydrogen Discussion #2561 — Hydrogen and Dev Store](https://github.com/Shopify/hydrogen/discussions/2561)
- [Shopify Dev Community — Hydrogen is not available on dev stores](https://community.shopify.dev/t/hydrogen-is-not-available-on-dev-stores/22866)
- [Hydrogen docs — Storefronts](https://shopify.dev/docs/storefronts/headless/hydrogen/storefronts)
- ADR-004 — Oxygen primary + Cloudflare fallback documented (the original, now amended by this ADR)
- PROJECT_PLAN.md §4 "Tech stack — 100% free-tier path"
