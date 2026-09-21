# RegenAI delivery roadmap

Updated 2026-09-21. Derived navigation for the [master build plan](../PROJECT_PLAN.md); task contracts, dependencies and completion evidence live there. The historical 105-day schedule is superseded, not a delivery promise.

| Phase | Outcome | Status |
|---|---|---|
| A | Preserve and accept original local frontend design | Local review delivered; final visual acceptance pending |
| B | Repair foundation; validate Node runtime; integrate real Shopify catalog/cart/accounts into Hydrogen | Active: inventory and foundation diagnosis |
| C | Secure merchant app, isolate environments, verify review workflow/webhooks and four Shopify Functions | Scaffold exists; blocking gaps documented |
| D | B2B, Markets, subscriptions, checkout extensions and customer/business utilities | Capability-gated; every feature needs evidence or explicit owner deferral |
| E | Deterministic recommendations, then approved/evaluated AI and necessary data reporting | Demo baseline only; no paid inference authorized |
| P | US/EU applicability, security/privacy/accessibility, SEO/AI-search, speed, monitoring and reliability | Planned; evidence and applicable specialist review required |
| S | 10k–1M+ scaling path, real code boundaries, workload tests, deployment templates and paid upgrade register | Design targets; no demonstrated capacity or observed 99% uptime |
| F | Existing-server deployment, Cloudflare routing, CI, backup/restore, rollback and public verification | Proposed; no deployment authorization inferred |

Intended storefront: Hydrogen on the existing VPS behind Cloudflare. Shopify keeps commerce, checkout and Function execution. Existing Worker-based merchant app is retained initially, subject to authentication/data-isolation repairs; an app-to-VPS migration is a separate decision.

Implementation is authorized as of 2026-09-21; see the master plan and private recovery checkpoint for current task status. Supervisor owns research, architecture, acceptance, review and authorized release. Luna low implements bounded local tasks. Current planning did not launch Luna or change application code/infrastructure.

Mobile, BLE, clinical/biomarker, supplement, community and white-label concepts remain the explicit future backlog in the master plan. They are not shipped functionality.

See the [scalability evidence guide](SCALABILITY.md) for required source/test links, upgrade categories and current limitations. The master plan requires used, tested code boundaries, not documentation-only claims.
