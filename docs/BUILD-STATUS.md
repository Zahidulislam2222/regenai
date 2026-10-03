# Build status

Updated 2026-10-03. **The expanded design-study storefront is live at https://regenai.zahidul-islam.com; full Shopify commerce remains incomplete.** Derived from the private project dossier and [master plan](../PROJECT_PLAN.md). Architecture, security, reliability, scale and compliance documentation: [docs index](README.md).

The merchant app has a **local, unreleased authorization repair**: D1-backed single-use OAuth state, expiring opaque sessions, encrypted new token writes and shop-filtered review list/detail routes. Nine focused tests passed; the local D1 migration and HTTP checks proved unauthenticated 401 and cross-shop 404 behavior. Whole-workspace typecheck, app lint and an app production bundle in an alternate ignored output directory passed. The normal Windows build directory remains locked. Preview/staging shared data bindings were removed from source; isolated databases, remote secret configuration, migration, legacy token rotation, sandbox installation and independent review remain open. The currently deployed merchant Worker was not changed by this work.

## Current storefront release — 2026-10-03

The ten-phase plan now governs completion. The home has visible original product imagery, a compact inspection section, category entry points, studio stories and FAQ. A journal index and three design articles were added. Product pages hide unverified prices and purchase controls; ordering remains closed. Read-only Shopify inventory found 15 unrelated sample products and no RegenAI recovery merchandise, so genuine product specifications, variants, prices, stock and fulfillment remain prerequisites. The updated static frontend was promoted on the existing VPS after a 28/28-file no-drift check; the previous release is retained for rollback.

Current checks: 95 storefront unit tests passed with one existing Windows-specific skip; whole-workspace TypeScript and lint passed with four existing warnings; frontend and final Hydrogen builds passed. Local Chrome verified desktop and 390px mobile, visible hero imagery, three inspection details, journal/article/product/filter/cart routes, and no prices or Add to bag on those pages. The actual Hydrogen Node server returned HTTP 200 for home, journal, article, collection, product, cart, robots and sitemap; an unknown article returned 404. A first-party image CSP failure found during Node testing was corrected; the final served product route loaded imagery and a 3D canvas with no page console errors or missing assets. The promoted static container reports healthy; public Chrome loaded the new article and product routes, with product assets HTTP 200, zero page console errors and no 390px overflow. Independent review, accessibility rerun and integrated commerce flows remain open. Historical verification below is retained with its original date and must not be read as the current release verdict.

## Latest verification — 2026-09-24

| Check | Result |
|---|---|
| Shopify Functions unit tests (`cargo test --workspace`) | 47/47 pass |
| Shopify Functions release WASM build | All 4 build; 159–181 KiB each, under Shopify's 256 kB limit |
| Live frontend security headers (CSP, frame, content-type, referrer, permissions, CORP) | Present on live response; HSTS not present (tracked as SEC-05) |
| `main` branch protection | PR + 1 approving review, linear history, no force-push — verified via GitHub API |
| Public documentation set | Architecture, scalability (1M+ model), reliability (99.9% target / 99.0% floor), security model, privacy, compliance, accessibility, contributing, security policy |

No application code, deployment or infrastructure changed in this update.

| Workstream | Current evidence | Next gate |
|---|---|---|
| A — frontend | Owner selected the newly built recovery design | Preserve during Hydrogen integration |
| B — foundation | B02 builds/type/lint/34 tests passed and Storybook checked in Chrome; first B03 dependency update installed with a valid dependency tree; audit reduced 69→63, critical 1→0 | Clean install passed; subsequent config/type fixes pass Windows checks and review; Linux check passed 8/10 gates, including 48 tests; offline CLI build and preset lint failures under repair. Node runtime tests pass 20/20; shared frontend SSR preparation reviewed with Chrome shopping/motion/3D checks passing; framework route integration active; remaining advisories open |
| C–F — integration and release | Existing scaffolds and live artifacts inventoried; no new release | Capability, security, sandbox flows and release gates |
| P — production controls | Demo scope clarified; applicability register reviewed | Implement and verify applicable controls |
| S — scale architecture | Local Docker available; local Kubernetes node Ready; workload contract reviewed | Implement used boundaries and bounded tests |

This is a client-facing portfolio demo. New features, legal compliance, observed uptime and traffic capacity are not claimed complete. Paid actions and publication retain explicit approval gates. Existing live services have not been modified.

Recovery notes and before/after task evidence are maintained locally in the private project memory directory. Each completed task needs check results and an independent review; an interrupted task remains unverified.

At stop: the selected visual demo has earlier passing browser/component evidence. The Node runtime and Hydrogen route migration remain unfinished; the focused Node/cache/privacy tests now pass (24/24, 2026-09-24); integrated acceptance remains outstanding. Full commerce, production controls and release acceptance are outstanding. Rough engineering estimate: 15–20% of full scope, 80–90% of visual demo work; these are estimates, not verified task completion rates.

## Selected frontend live review

The new visual demo is published at **https://regenai.zahidul-islam.com**. Frontend type/lint/build and 24 focused tests passed; local and public Chrome/HTTP checks passed. See [release evidence summary](FRONTEND-DEPLOYMENT.md). This does not resume or complete the paused Hydrogen/Shopify integration.

## Publication checkpoint — 2026-09-22

The current branch preserves unfinished integration work and the verified standalone frontend. It is a work-in-progress checkpoint, not an integrated release.

| Gate | Current result |
|---|---|
| Dedicated frontend typecheck, lint, production build | Pass; deployed artifact unchanged |
| Full storefront unit suite | 94 passed, 1 Windows-specific skip |
| Whole-workspace typecheck | Fails in paused Node runtime/cart/legacy-route typing |
| Whole-workspace lint | Fails on one React Router configuration naming rule; four warnings remain |
| Hydrogen build with codegen | Fails because a route export reaches a server-only logger outside the permitted server boundary |
| Client document | Existing Google Doc updated; verified nine-page PDF and public Markdown refreshed |

These full-project failures must be fixed and rerun before an integrated release. The client-facing overview distinguishes delivered features from planned controls and untested scale/uptime targets.
