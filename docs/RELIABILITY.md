# Reliability, uptime and disaster recovery

Updated 2026-09-24. Related: [SCALABILITY.md](SCALABILITY.md), [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY-MODEL.md](SECURITY-MODEL.md).

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

### Why a single server cannot meet 99.9%

Availability of components in series multiplies. *Illustration:* a single origin host at 99.5%, a CDN at 99.99% and an upstream API at 99.95% combine to roughly 99.44% — below target. Reaching 99.9% requires removing single points of failure at the origin: at least two independent instances behind a health-checked load balancer, so one host failure does not take the store down. The current live frontend runs on one host and is therefore **not** expected to meet 99.9%; this is a known T0 limitation.

## 2. Service level indicators (SLIs)

Each SLI is measured per journey and per region (US, EU), never blended into one number that could hide a broken region.

| Journey | SLI — good event definition | Objective |
|---|---|---|
| Storefront browse | Homepage, collection and product page return 2xx with expected content, from external probes in US and EU | 99.9% of probe intervals |
| Server latency | HTML responses served at origin in < 1 s | 95% of requests |
| Cart | Well-formed add/update/remove cart mutations succeed | 99.9% of requests |
| Checkout hand-off | Cart → Shopify checkout URL succeeds (sandbox journey probe; never a real card) | 99.9% of probe runs |
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

Response targets assume a staffed on-call rota, which does not exist for this demo. They define the operating model required for a production launch; they are not a current commitment.

Security incidents additionally follow [SECURITY.md](../SECURITY.md) and applicable breach-notification law (for example, GDPR Article 33 requires notifying the supervisory authority within 72 hours where applicable; see [COMPLIANCE.md](COMPLIANCE.md)).

## 7. Observability

| Signal | Planned implementation |
|---|---|
| External uptime | Probes from at least two regions, hosted independently of the origin, so a host failure is still detected |
| Metrics | Request rate, error rate, latency percentiles per route; CPU, memory, event-loop lag; cache hit ratio; upstream throttling; queue age and dead-letter count |
| Logs | Structured, redacted (no tokens, no personal or health data), bounded retention |
| Traces | Request correlation ID from edge through origin to upstream calls |
| Alerts | Burn-rate SLO alerts; certificate, secret and backup expiry alerts |

Today: the live frontend logs only HTTP status and method; no metrics platform, external probe or alerting is connected yet.

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
