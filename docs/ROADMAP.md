# Roadmap

Updated 2026-10-08. Phases are dependency ordered; dates and capacity are not promised. [Build status](BUILD-STATUS.md) owns dated evidence and the [master plan](../PROJECT_PLAN.md) retains task contracts.

## Current delivery

| Area | Verified now | Next exit gate |
|---|---|---|
| Storefront | Live Shopify catalog and original 3D design, category/search/product/finder/editorial routes, closed-ordering gates | Full buyer account and development-store order journeys; broader manual accessibility |
| Python assistant | Live chat/console, encrypted memory, policies, approvals, handoff and durable jobs; two model checks passed | Real test-store refund plus designated inbox reply, receipt/reconciliation proof, then controlled write activation |
| Shopify support connection | Dedicated installed app, least-privilege scope readback, renewal, repeated reads and restart | Client-specific protected-data permissions and matching/refund proof |
| Gmail | Installed-client offline grant, dedicated label, actual refresh/read, bounded empty-label import and restart | Durable consent strategy, representative ticket import/reply proof, owner-reviewed recurring schedules |
| Merchant app | Local authentication and privacy repairs; older public endpoints disabled | Isolated remote data/secrets, six migrations, install/OAuth, subscriptions and real webhook delivery |
| Functions | Three compiled/inactive draft Functions with local runtime evidence | Eligible store activation and restricted checkout behavior; redesign unsupported discount rules |
| Client handoff | Installation guide, skill/rulebook inputs, setup log and recommendation-only MCP | Actual client-computer installation, owner-led first sessions, policy acceptance and handover |

The implementation role's Loom, hourly rate, availability, NDA and communication assessment are personal deliverables. Software cannot establish them.

## Reliability and capacity milestones

| Phase | Required change | Evidence required to exit |
|---|---|---|
| T0 — establish operations | External monitoring, redacted metrics, backup/restore, credential-expiry handling, scoped incident ownership | Complete 30-day journey SLI window; restore and rollback measurements; current limitations retained |
| T1 — model 10k active users | Validate route/session mix, warm/cold cache and isolated provider workloads; measure single-instance ceilings | Reproducible workload report with latency, errors, dropped work, resources and costs; no tier claim from functional checks |
| Assistant storage migration | Tenant authorization, managed shared database, lease/queue semantics, encryption/key rotation and per-tenant budgets | Cross-tenant negative tests; migration/recovery and idempotency/concurrency proofs; external execution reconciliation |
| T2 — model 100k active users | Independent failure domains, shared storage/cache/queues, bounded admission and autoscaling | Approved staging workload plus host-loss/dependency-outage tests; provider quota agreements |
| T3 — model 1M+ active users | Region/routing/failover design, controlled cache warming, regional data policy and model-capacity procurement | Coordinated workload on named infrastructure; regional failure/restore drills; quota, cost and staffing review |

AI inference concurrency, browsing concurrency and logged-in users are separate workloads. [SCALABILITY.md](SCALABILITY.md) supplies equations and costs; [WORKLOAD-CONTRACT.md](WORKLOAD-CONTRACT.md) supplies test boundaries. No high-volume live-provider testing is authorized by this roadmap.

## Launch controls

Resolve applicable privacy/AI/product/consumer-law decisions, vendor agreements, retention and rights handling. Finish the remaining development-tool advisory review, independent security assessment, accessibility journeys, operational staffing and monitoring. Keep the 99.9% target and 99.0% floor as SLOs until measured; contractual promises require separate business approval.

Future commerce, subscriptions, Markets, messaging providers, server voice/media and other integrations each need a scoped specification, provider-capability check, cost authorization, tests and client privacy review. The earlier feature backlog remains in the master plan; this publication does not mark it complete.
