# Reliability, uptime and disaster recovery

Updated 2026-10-08. Related: [SCALABILITY.md](SCALABILITY.md), [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY-MODEL.md](SECURITY-MODEL.md).

> **Status: objectives defined; not yet measured.** The targets below are engineering objectives (SLOs), not a contractual SLA and not observed uptime. An uptime figure will be published only after a full 30-day window of external monitoring.

## 1. Availability objectives

RegenAI sets a **99.9% target** and a **99.0% floor**:

- **Target (99.9%)** — what the architecture is designed and operated to achieve.
- **Floor (99.0%)** — the minimum acceptable level. Falling below it freezes feature releases until reliability work restores the budget.

Downtime allowed per rolling 30-day window (43,200 minutes) and per 365-day year:

| Availability | Per 30 days | Per year |
|---|---|---|
| 99.0% (floor) | 7 h 12 min | 3 d 15 h 36 min |
| **99.9% (target)** | **43 min 12 s** | **8 h 45 min 36 s** |
| 99.95% | 21 min 36 s | 4 h 22 min 48 s |

Why 99.9% and not 99%: 99% allows over seven hours of downtime per month, which is too much for an online store where downtime is lost revenue. 99.9% is a common target for e-commerce storefronts and is achievable without multi-region active-active complexity. Higher targets (99.95%+) are reserved for Tier T3 in [SCALABILITY.md](SCALABILITY.md).

### Single-host failure remains an availability risk

Availability of components in series multiplies. *Illustration:* a single origin host at 99.5%, a CDN at 99.99% and an upstream API at 99.95% combine to roughly 99.44% — below target. Reaching 99.9% requires removing single points of failure at the origin: at least two independent instances behind a health-checked load balancer, so one host failure does not take the store down. The current live frontend and assistant run on one host and is therefore **not** expected to meet 99.9%; this is a known T0 limitation.

## 2. Service level indicators (SLIs)

Each SLI is measured per journey and per region (US, EU), never blended into one number that could hide a broken region.

| Journey | SLI — good event definition | Objective |
|---|---|---|
| Storefront browse | Homepage, collection and product page return 2xx with expected content, from external probes in US and EU | 99.9% of probe intervals |
| Server latency | HTML responses served at origin in < 1 s | 95% of requests |
| Cart | Well-formed add/update/remove cart mutations succeed | 99.9% of requests |
| Checkout hand-off | Cart → Shopify checkout URL succeeds (development environment journey probe; never a real card) | 99.9% of probe runs |
| Merchant app | Authenticated admin pages load | 99.5% of probe intervals |
| Webhook processing | Shopify webhooks processed within 5 minutes of receipt | 99.9% of deliveries |
| Page experience (field) | Core Web Vitals at p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 ([web.dev](https://web.dev/articles/vitals)) | Tracked once traffic is sufficient |

Measurement rules: failures of Shopify or Cloudflare that customers see **count** against availability (root cause is attributed separately). Planned maintenance counts. Missing monitoring data counts as unknown, never as success. A homepage `200` alone does not prove checkout works.

## 3. Error budget policy

The error budget is 100% minus the objective — 43 minutes per 30 days at 99.9%.

| Budget state | Action |
|---|---|
| > 50% remaining | Normal releases |
| 25–50% remaining | Releases require a rollback plan reviewed in advance |
| < 25% remaining | Only reliability fixes and security patches ship |
| Exhausted, or availability below the 99.0% floor | Release freeze; incident review; reliability work prioritised until recovered |

Alerting uses burn-rate thresholds, following the [Google SRE workbook](https://sre.google/workbook/implementing-slos/): a fast burn (budget gone in hours) pages immediately; a slow burn raises a ticket.

## 4. Designing for failure

| Failure | Designed behaviour |
|---|---|
| One storefront instance dies | Load balancer health check removes it; remaining instances absorb traffic (N+1 capacity) |
| Whole origin region down (T3) | DNS/load-balancer failover to the other region |
| Shopify Storefront API slow or down | Timeouts and circuit breakers; cached public catalog pages keep rendering (stale-if-error); cart shows an honest error rather than stale inventory |
| Checkout throttled by Shopify | Backoff with jitter; "high demand" message; no retry storm |
| Recommendations or optional services fail | Deterministic fallback; shopping unaffected |
| Bad deploy | Immutable releases; one-step rollback to the previous release; health checks gate promotion |
| Webhook handler crash | Queue retains the message; retry; dead-letter queue with replay; idempotency prevents double processing |
| Cache stampede after purge | Request coalescing and stale-while-revalidate; staged purges |

## 5. Backup and disaster recovery

| Data | Where it lives | Recovery point objective (RPO) | Recovery time objective (RTO) | Mechanism |
|---|---|---|---|---|
| Catalog, orders, customers, payments | Shopify (system of record) | Shopify-managed | Shopify-managed | Shopify platform responsibility |
| Storefront application | Git + immutable container/release artifacts | 0 (stateless) | 30 min target | Redeploy last known-good release |
| Live frontend release | Versioned release directories + off-server archive | 0 | 15 min target | Re-select previous release; archive extract-and-compare verified 2026-09-22; rollback drill pending |
| Merchant app database (D1) | Cloudflare D1 | ≤ 1 min target | 1 h target | D1 Time Travel point-in-time restore — *verified provider capability:* any minute within the last 30 days on Workers Paid, 7 days on Free ([D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)); plus scheduled off-platform exports |
| Configuration and secrets | Private secret store | Per change | 1 h target | Documented recovery record kept outside the repository |

RPO/RTO values are targets. They become claims only after a **restore drill** measures them; drills are required before release and then quarterly. Backups must not depend solely on the host they protect.

## 6. Incident response

| Severity | Definition | Response target | Update cadence |
|---|---|---|---|
| SEV-1 | Storefront or checkout unavailable, data exposure, or security breach | Acknowledge within 15 min | Every 30 min |
| SEV-2 | Major feature broken for many users; SLO burning fast | Acknowledge within 1 h | Every 2 h |
| SEV-3 | Minor degradation with a workaround | Next business day | On resolution |

Process: detect (alert or report) → assign an incident lead → mitigate first (rollback, failover, feature flag off) → communicate status → resolve → blameless post-incident review within 5 business days, with action items tracked to completion.

Response targets assume a staffed on-call rota, which does not exist for this application. They define the operating model required for a production launch; they are not a current commitment.

Security incidents additionally follow [SECURITY.md](../SECURITY.md) and applicable breach-notification law (for example, GDPR Article 33 requires notifying the supervisory authority within 72 hours where applicable; see [COMPLIANCE.md](COMPLIANCE.md)).

## 7. Observability

| Signal | Planned implementation |
|---|---|
| External uptime | Probes from at least two regions, hosted independently of the origin, so a host failure is still detected |
| Metrics | Request rate, error rate, latency percentiles per route; CPU, memory, event-loop lag; cache hit ratio; upstream throttling; queue age and dead-letter count |
| Logs | Structured, redacted (no tokens, no personal or health data), bounded retention |
| Traces | Request correlation ID from edge through origin to upstream calls |
| Alerts | Burn-rate SLO alerts; certificate, secret and backup expiry alerts |

Today: the Hydrogen logger redacts private values, and the assistant retains bounded operational audit records and worker health. Independent external SLO monitoring and a centralized metrics/alerting platform are not connected; no observed uptime figure is available.

## 8. Current status

| Item | Status |
|---|---|
| SLO definitions (this document) | **Defined** |
| External uptime monitoring | **Planned** |
| Redundant origin (≥2 independent instances) | **Planned** — live frontend is a single host |
| Immutable releases and rollback | **Live** for the frontend; archive restore verified 2026-09-22; rollback drill not yet run |
| D1 point-in-time recovery | **Available from provider**; restore drill not yet run |
| Incident runbooks | **Planned** |
| Observed 30-day availability | **Not yet measured** |

## 9. Assistant journeys and measurement policy

The 99.9% target and 99.0% floor extend to assistant service availability. Measure public chat, owner-console access, connection health, scheduled work and human handoff independently. Until schedules are enabled, their service-level result is unavailable. Model answer usefulness/safety is an evaluation result separate from HTTP availability.

| Journey | Proposed good event | Measurement boundary |
|---|---|---|
| Customer chat | Valid allowed message completes with usable response or documented service state within the configured deadline | Browser → API → model; dependency failures count when users cannot complete the journey |
| Owner console | Authenticated operator can read a ticket/policy and save an authorized decision | UI/API/storage; prohibited unauthenticated requests excluded as expected denials |
| Inbox synchronization | Enabled scheduled run completes inside its configured freshness objective | Grant health, label-only import, queue age and provider quota; no current recurrence claim |
| Human handoff | Sensitive case is retained with full context and appears in the review queue | Internal record creation; staff acknowledgement has a separately agreed staffing target |
| Approved refund/reply | One approved action has authoritative receipt or visible reconciliation hold | Future verified write workflow; never count an uncertain action as a success |

Choose the actual observation window, sampling interval, success predicate and latency threshold in versioned monitoring configuration. Report permitted rate-limit responses and budget denials separately; if admitted demand cannot complete, count it as failed service rather than removing it to improve the SLI. Track missing observations as unknown. Publish request-based success ratio and time-based probe availability separately: the 43m12s and 7h12m monthly allowances above apply to time-based 30-day availability, not to a request-count SLI.

## 10. Recovery objectives for support state

| Asset | Proposed objective | Current evidence / next step |
|---|---|---|
| Encrypted messages, tickets, policies and audit | RPO ≤15 minutes; RTO ≤1 hour | Host-side consistent SQLite backup integrity checked; encrypted off-host recovery and timed restore remain due |
| Job/action and spending ledgers | Preserve completed/ambiguous actions and prior spending; reconcile any recovery gap before execution | Restart persistence tested; provider reconciliation and disaster restore still need end-to-end proof |
| Encryption keys and delegated grants | Recover compatible keys per change; diagnose/re-consent before reconnecting | Private recovery records exist; verify access separately from backup content |
| Service/routing artifacts | RTO ≤30 minutes | Immutable frontend/backend release and routing manifests; timed live rollback drill remains due |

Budget reservations and uncertain financial claims must survive recovery. Never restore a stale ledger and resume spending/actions without reconciliation. A host-local backup cannot protect against losing that host.

## 11. Failure runbooks

| Trigger | First response | Verification before recovery |
|---|---|---|
| Worker heartbeat stale | Check bounded logs/queue; let service restart policy recover; preserve leases | Readiness and one safe read/scheduled operation after restart |
| Token expired / revoked | Identify grant and scopes, clock and installation; refresh or re-consent | Repeated bounded provider reads; never repeat an ambiguous refund/send |
| AI provider unavailable or budget exhausted | Stop new paid calls; preserve ticket/handoff; expose a clear status | Provider health and remaining verified budget, then bounded owner-approved check if required |
| Queue old or storage near quota | Pause new admission, preserve records, diagnose retry/dead-letter cause | Age/throughput recover without lost or duplicated jobs |
| Incorrect release | Restore compatible previous route/services | Public journey smoke and exact source/image/env/routing parity |
| Suspected exposure | Restrict affected access, preserve bounded evidence, rotate affected credentials | Security-owner investigation and applicable incident/notification process |

Google Testing Gmail grants may expire after seven days; this prevents an indefinite unattended inbox claim. A production consent/verification strategy and provider-compliant access are client-launch prerequisites. The system supports continuous operation, while a staffed rota, redundant hosts and observed SLOs remain future requirements. [Google token expiry](https://developers.google.com/identity/protocols/oauth2#expiration), [SRE SLO implementation](https://sre.google/workbook/implementing-slos/).
