# Roadmap

Updated 2026-10-04. Task-level acceptance criteria and dependencies live in the [master plan](../PROJECT_PLAN.md). Current evidence lives in [BUILD-STATUS.md](BUILD-STATUS.md). Phases are ordered by dependency; dates are not promised. Work has resumed on the buyer and merchant sandbox phases.

## Current frontend-first phases

| Phase | Status | Verified now | Due before phase exit |
|---|---|---|---|
| F1 — Shopping journey | Implemented for the concept demo; acceptance open | Six Shopify concept products, discovery and comparison are live; the enabled development-store cart passed the desktop/mobile 0→1→2→1→0 flow locally; public cart writes remain closed | Fresh F1 journey review and a real unavailable-variant browser case when a test variant exists |
| F2 — Frontend completeness | Live review release verified; manual check open | Help/contact/policies, approved hero, source-specific finder copy, search, SEO and responsive checks; exact-image staging/main releases and independent source review passed | Full manual screen-reader journey and broader route-level visual acceptance |
| B1 — Buyer platform | In progress | Test gateway and hosted checkout form verified; staging Account sign-in redirects to Shopify with PKCE and the registered callback; main Account and public carts remain closed | Explicitly approved development-store test order and Admin readback; buyer email/OTP login and logout; main account settings as needed |
| B2 — Merchant platform | In progress | Inactive sandbox app draft with three Functions exists; legacy Worker's public URLs are closed; local uninstall and privacy webhooks, D1 migrations, merchant queue/export and signed HTTP flow passed | Remote D1 access/isolation, migration, released webhook subscriptions and real deliveries, install, OAuth, eligible Function activation and real sandbox behavior |
| R1 — Production controls | Due | Bounded frontend security, accessibility and performance evidence exists; PR #20 passed GraphQL contract, CodeQL, gitleaks, unit, lint, E2E, accessibility and the narrow demo-copy guard on Linux; Percy is explicitly skipped without opt-in and k6 is manual-only locally; a CI-verified Vitest patch reduced full npm advisories 54→51 with runtime audit still zero | Real visual/load coverage, remaining development-tool advisory review, regulated-product review, full config/security audit, restore drill, monitoring and measured performance/reliability evidence |
| R2 — Release and handoff | Due for full platform | The current frontend alone is released with local/live hash parity | Integrated buyer/merchant release, live rollback drill and final handoff |

## Where the project is

| Milestone | Outcome | Status |
|---|---|---|
| **M1 — Visual storefront** | Original 3D product design, catalog, finder, bag; live for review | **Done** — live at https://regenai.zahidul-islam.com |
| **M2 — Integrated Shopify store** | Real development-store catalog, cart, accounts and test checkout through Hydrogen; secured merchant app; verified Functions | In progress |
| **M3 — Production-grade platform** | M2 plus security, privacy, accessibility, observability, reliability and scale evidence; backups and rollback drilled | Planned |

## Earlier workstream breakdown (historical)

### Phase A — Frontend ✅
Selected visual design, original Blender assets, Three.js product inspection, accessible shopping flow, live deployment with rollback.

### Phase B — Foundation and Shopify integration 🔄
- Repair full-workspace build, typecheck and lint
- Finish the Node server adapter for self-hosted Hydrogen (settings, bounded public cache, safe logging — built, integration pending)
- Port the visual storefront into Hydrogen routes with real Storefront API data
- Local-only Shopify cart built and browser-verified for owned variants; development-store test order and Customer Account API sign-in remain open
- Dependency advisory remediation; masked CI checks made honest

### Phase C — Merchant app and Shopify Functions
- Close security release blockers SEC-01 to SEC-04 ([SECURITY-MODEL.md](SECURITY-MODEL.md)): token encryption, per-shop authorization, atomic OAuth state, isolated environments
- Separate modern sandbox app created; approved draft version `regenai-merchant-sandbox-4` contains three migrated Functions and is verified inactive. The legacy custom app cannot serve this path. Release, install, OAuth credential wiring and store activation remain open.
- Webhook intake with HMAC verification, queue, idempotency and dead-letter replay
- Shopify mandatory privacy webhooks
- Run development-store activation and checkout tests for the three current-schema Functions. The fourth discount stacking prototype is outside deployment because validation input lacks applied codes; redesign it with a supported Discount API architecture. B2B line updates require Plus, so the free-store path cannot prove that operation active.

### Phase D — Commerce features
B2B pricing and company accounts, Shopify Markets (US/EU currencies and languages), subscriptions, checkout extensions — each enabled only after plan/capability verification.

### Phase E — Recommendations and data
Deterministic recommendation baseline first. Optional AI recommendations only behind server-side configuration, with evaluation, disclosure and no sensitive inputs.

### Phase P — Production readiness
| Area | Deliverable |
|---|---|
| Security | OWASP ASVS L2 control mapping, negative auth/tenant tests, DAST, external penetration test before launch |
| Privacy & legal | Processor register, consent where needed, rights handling, legal review — see [COMPLIANCE.md](COMPLIANCE.md) |
| Accessibility | Manual screen-reader journeys, zoom/reflow, CI axe gates — see [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| SEO & AI search | Server-rendered HTML, structured data, sitemaps, canonical URLs, correct status codes |
| Performance | Budgets for JS, images and 3D assets; Core Web Vitals p75 targets |
| Observability | Metrics, redacted logs, traces, external uptime probes, burn-rate alerts |
| Reliability | 99.9% availability target with 99.0% floor, error-budget policy, runbooks, restore drills — see [RELIABILITY.md](RELIABILITY.md) |

### Phase S — Scale (10k → 100k → 1M+ concurrent users)
| Step | Deliverable |
|---|---|
| S1 | Workload model and k6 scenarios with failing CI thresholds |
| S2 | Stateless storefront proven on multiple instances behind a load balancer |
| S3 | Cache coalescing, backpressure, timeouts/retry budgets, durable job queue |
| S4 | Measured per-instance throughput and horizontal-scaling test |
| S5 | Tier T1/T2 infrastructure templates (multi-host, autoscaling) |
| S6 | Tier T3 design: multi-region origin, failover, launch-day playbook, provider capacity review |

Details and math: [SCALABILITY.md](SCALABILITY.md).

### Phase F — Release engineering
Candidate-revision CI, staged deploys, parity checks, backup/restore, rollback drills, public verification.

## Future backlog (not scheduled)
Mobile app (sharing the `@regenai/ui` component API), wearable/BLE integrations, clinician-facing features, community features and white-label deployment. These are ideas, not commitments, and each would need its own privacy and regulatory review.
