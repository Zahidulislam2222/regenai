# Roadmap

Updated 2026-09-24. Task-level acceptance criteria and dependencies live in the [master plan](../PROJECT_PLAN.md). Current evidence lives in [BUILD-STATUS.md](BUILD-STATUS.md). Phases are ordered by dependency; dates are not promised.

## Where the project is

| Milestone | Outcome | Status |
|---|---|---|
| **M1 — Visual storefront** | Original 3D product design, catalog, finder, bag; live for review | **Done** — live at https://regenai.zahidul-islam.com |
| **M2 — Integrated Shopify store** | Real development-store catalog, cart, accounts and test checkout through Hydrogen; secured merchant app; verified Functions | In progress |
| **M3 — Production-grade platform** | M2 plus security, privacy, accessibility, observability, reliability and scale evidence; backups and rollback drilled | Planned |

## Phases

### Phase A — Frontend ✅
Selected visual design, original Blender assets, Three.js product inspection, accessible shopping flow, live deployment with rollback.

### Phase B — Foundation and Shopify integration 🔄
- Repair full-workspace build, typecheck and lint
- Finish the Node server adapter for self-hosted Hydrogen (settings, bounded public cache, safe logging — built, integration pending)
- Port the visual storefront into Hydrogen routes with real Storefront API data
- Real cart, Customer Account API sign-in, sandbox checkout on a development store
- Dependency advisory remediation; masked CI checks made honest

### Phase C — Merchant app and Shopify Functions
- Close security release blockers SEC-01 to SEC-04 ([SECURITY-MODEL.md](SECURITY-MODEL.md)): token encryption, per-shop authorization, atomic OAuth state, isolated environments
- Webhook intake with HMAC verification, queue, idempotency and dead-letter replay
- Shopify mandatory privacy webhooks
- Revalidate the four Functions against the current API version and run store activation tests (unit tests and WASM size already verified)

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
