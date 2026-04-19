# ADR-001 — Why Hydrogen over a Liquid theme

**Status:** Accepted
**Date:** 2026-04-20 (Day 2)
**Deciders:** Zahidul Islam (solo)
**Supersedes:** —
**Superseded by:** —

---

## Context

RegenAI Phase 1 needs a storefront for a regulated-niche DTC wellness brand that must deliver:

- 22 templates, 5 locales (EN + ES + FR + DE + AR with RTL), 5 Shopify Markets (US / CA / UK / EU / AU)
- Full Shopify Plus B2B — companies, locations, price lists, net-30, approval chains
- 4 Shopify Functions (Rust/WASM) for cart contraindication validation, B2B pricing, delivery customization, discount stacking
- A custom Remix app on Cloudflare Workers + D1 for clinician-review workflow, protocol engine, contraindication rules
- Real ML recommendation engine via pgvector + Claude/OpenAI embeddings
- 10 JSON-LD schemas (Product, Organization, FAQ, Breadcrumb, Review, AggregateRating, Article, HowTo, MedicalWebPage, VideoObject)
- Compliance-as-code CI (FDA claim lint, DSHEA, contraindication callout enforcement)
- Lighthouse ≥ 95 across all categories
- WCAG 2.2 AA
- Phase 2 integration with a React Native / Expo mobile app (shared component model + shared types)

Kindred Grove (the author's prior portfolio project) is built on Liquid + Theme Blocks. That approach demonstrates senior Shopify-theme skill but has known limits that matter for RegenAI:

1. **No shared component system with the future mobile app.** Liquid doesn't serialize to React Native; in Phase 2 we'd rebuild every component twice.
2. **Complex client-side interactions** (Web Bluetooth posture-sensor pairing, multi-step protocol UI, recommendation-engine query UI) are awkward in Liquid + Web Components vs. React's state + effect primitives.
3. **Metaobject-driven editorial at scale** (200+ clinical articles Phase 2, biomarker dashboards Phase 3) needs a CMS like Sanity alongside metaobjects; Hydrogen integrates cleanly via `@sanity/client`, Liquid themes need iframe / app-proxy hacks.
4. **Agency-tier AI workflow demonstration** benefits from TypeScript + React, which is the industry lingua franca for frontend engineering teams. A Liquid-only portfolio signals "Shopify specialist"; Hydrogen broadens the reach without losing Shopify depth.
5. **B2B + Markets Catalog segmentation** in Liquid requires more conditional rendering in templates; Hydrogen's loader pattern queries the right market/catalog context and passes typed data to components — cleaner and testable.
6. **Edge-personalization (Cloudflare Workers middleware for A/B, geo-targeting, PDP variant)** is natural on a headless architecture. Theme stores do A/B via localStorage or external SDKs that add render-blocking JS.

Anderson Collaborative's JD explicitly lists Hydrogen / Next.js headless Shopify as a nice-to-have. Kindred Grove didn't cover it; RegenAI does.

### Alternatives considered

| Option | Reason rejected |
|---|---|
| Liquid theme (Theme Blocks / Horizon style like Kindred Grove) | Already demonstrated in KG. Limits §1–§6 above. Doesn't close the JD headless gap. |
| Next.js 15 + Storefront API (headless without Hydrogen) | Loses Hydrogen's built-in cart, analytics, customer auth, caching, and Oxygen free hosting. Requires hand-rolling every Shopify integration. |
| Remix (pre-v7) standalone | Essentially what Hydrogen is built on. Using vanilla Remix vs Hydrogen means giving up Shopify-tuned components + Oxygen free hosting + first-class Shopify CDN. |
| Shopify Storefront UI Kit / Dawn customization | Merchant-facing, not dev-facing. Not portfolio-grade. |
| Astro + Storefront API | Great for static marketing, thin for cart/checkout-heavy storefronts. No built-in Shopify integration. |
| Gatsby + Shopify plugin | Deprecated ecosystem; SSG-first is the wrong default for commerce. |

## Decision

**Use Hydrogen 2026.4.0 with React Router 7 as the storefront framework, deployed to Oxygen.**

Concrete consequences locked in by this decision:
- Framework: Hydrogen (wraps Remix / React Router v7 as of this version)
- Language: TypeScript strict
- Styling: Tailwind CSS v4 (CSS-first configuration; no `tailwind.config.ts`)
- Routing: React Router v7 file-based
- Hosting: Oxygen (free on Partner Plus Dev Store) with Cloudflare Pages as documented fallback
- Data source: Storefront API (GraphQL) primary + Admin API where Storefront doesn't cover (B2B, Functions config)
- i18n: subfolder-based (`/en`, `/es`, `/fr`, `/de`, `/ar`)
- Component sharing: `@regenai/ui` published as an npm package, consumed by storefront + future mobile app + custom Remix app admin UI

## Consequences

### Positive
- JD nice-to-have (headless) satisfied with real built evidence, not claims.
- Component library is portable to React Native (Phase 2).
- TypeScript throughout — catches metafield / Storefront schema drift at build time.
- Oxygen free tier covers Phase 1 portfolio traffic; Cloudflare Pages + Workers KV / D1 as fallback.
- Clean mental model: loader / action pattern mirrors server-side data fetching + mutation, testable in isolation.
- Edge-personalization via Cloudflare Workers middleware is trivial to add.

### Negative / accepted costs
- Steeper learning curve vs a Liquid theme. Days 1–2 explicitly budget time for Hydrogen + React Router v7 onboarding; AI-WORKFLOW tracks first-week velocity to flag drag.
- Merchant-facing editor workflow is different from Liquid themes. Merchants editing content via Sanity + metaobject admin + PR-based theme changes is a UX inversion. MERCHANT-GUIDE.md (Day 20) addresses this explicitly — scope requires budgeting human review time for the handoff document.
- npm audit vulns from fresh scaffold (19 as of Day 2, mostly transitive in dev-dep chain). Scheduled for security pass on Day 19; not a shipping blocker.
- Hydrogen's React Router v7 uses virtual types (`./+types/*`, `virtual:react-router/server-build`) which fail naive `tsc --noEmit` without running `react-router typegen` first. `npm run codegen` resolves. Tracked as a dev-loop detail; not a shipping blocker.
- Hydrogen 2026.4.0 is a recent release; minor ecosystem churn possible over the 105-day build. We'll pin the exact version in `package.json` and only upgrade with a dedicated ADR.

### Reversibility
Low-medium. Reverting to a Liquid theme after Day 10 would cost ~Days 1–10 of work (storefront scaffolding, design system wiring, CSP + theme provider, PLP, PDP). Component library in `@regenai/ui` survives a framework change since it's React-only, but the storefront shell would be rewritten.
