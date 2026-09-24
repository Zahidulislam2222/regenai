# Scalability and capacity plan — 10k to 1M+ concurrent users

Updated 2026-09-24. Owner of task IDs and acceptance criteria: [PROJECT_PLAN.md §12B](../PROJECT_PLAN.md#12b-scalability-workstream-s--credible-path-to-10k1m-active-sessions). Related: [ARCHITECTURE.md](ARCHITECTURE.md), [RELIABILITY.md](RELIABILITY.md), [WORKLOAD-CONTRACT.md](WORKLOAD-CONTRACT.md).

> **Status: designed architecture, not measured capacity.** This document explains how RegenAI is designed to serve 1,000,000+ simultaneous active shoppers and what each tier requires. No load test at these volumes has been run. Numbers below are labelled either *verified provider limit* (checked against official documentation on 2026-09-24) or *planning assumption*. A capacity claim is made only after a measured test — see §8.

## 1. What "1M concurrent users" means here

Capacity claims are meaningless without a definition. RegenAI uses:

| Term | Definition |
|---|---|
| **Active session** | One shopper journey in progress (browsing, cart, checkout). Not a monthly visitor, not an open tab. |
| **Edge request rate** | Application requests per second arriving at the CDN (Cloudflare). Static assets counted separately. |
| **Origin request rate** | Requests per second that miss the CDN and reach RegenAI's storefront servers. |
| **Checkout creations** | Carts converted to Shopify checkouts per second. Handled by Shopify, not RegenAI servers. |

## 2. Why this architecture scales

The design deliberately pushes the hardest parts of commerce onto platforms that already operate at very large scale, and keeps RegenAI's own servers stateless.

| Layer | Who runs it | Scaling property |
|---|---|---|
| Checkout, payments, orders, inventory | Shopify | Shopify reported a peak of **$5.1M in sales per minute** during Black Friday 2025 across its merchants ([Shopify, BFCM 2025](https://www.shopify.com/news/bfcm-data-2025)). RegenAI inherits this checkout infrastructure. |
| Storefront API (catalog, cart) | Shopify | *Verified provider limit:* "requests from real buyers aren't subject to a fixed request-per-minute limit"; a separate checkout-creation throttle applies; bot traffic is limited ([Storefront API](https://shopify.dev/docs/api/storefront)). |
| Shopify Functions (pricing, validation, delivery) | Shopify | Execute inside Shopify's checkout; *verified limits:* 11M instructions, 256 kB binary, 128 kB input per run ([Function limits](https://shopify.dev/docs/api/functions/latest)). No RegenAI server involved. |
| CDN, TLS, DDoS absorption | Cloudflare | Global anycast network in front of the origin. |
| Merchant app | Cloudflare Workers | *Verified:* "no general limit on requests per second" on the Paid plan; Free plan capped at 100,000 requests/day ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). |
| Storefront rendering (Hydrogen SSR) | RegenAI | **The part RegenAI must scale itself.** Stateless containers behind a load balancer, protected by CDN caching. |

## 3. Capacity model

For `U` active sessions, each making `r` application requests per second, with a dynamic (uncacheable) share `d` and a CDN hit ratio `h` on cacheable pages:

```
edge_rps   = U × r
origin_rps = U × r × [ d + (1 − d) × (1 − h) ]
```

**Planning assumptions** (to be replaced by measured values from [WORKLOAD-CONTRACT.md](WORKLOAD-CONTRACT.md)): one application request every 30 seconds per session (`r = 1/30`), 5% dynamic traffic (`d = 0.05`: cart, account, personalised), 99% CDN hit ratio on public pages (`h = 0.99`), 2× burst factor, and 1% of active sessions starting checkout within any 10-minute window.

| Tier | Active sessions | Edge rps | Origin rps (warm cache) | Origin rps (2× burst) | Cold cache (no burst) | Cold cache + 2× burst | Checkout creations/s (to Shopify) |
|---|---:|---:|---:|---:|---:|---:|---:|
| T1 | 10,000 | 333 | 20 | 40 | 333 | 667 | 0.2 |
| T2 | 100,000 | 3,333 | 198 | 397 | 3,333 | 6,667 | 1.7 |
| T3 | 1,000,000 | 33,333 | 1,983 | 3,967 | 33,333 | 66,667 | 16.7 |

What the table shows:

1. **The CDN hit ratio is the single most important variable.** At 1M sessions, a 99% hit ratio means the origin sees ~2,000 rps; a cold cache means ~33,000 rps (~67,000 during a 2× burst) — a 17× difference. Cache design, warm-up and stampede protection are therefore first-class engineering work (§5).
2. **Checkout volume is small relative to browsing** and is processed by Shopify.
3. **Origin sizing comes from measurement, not guesswork.** If one storefront instance sustains `P` requests/second at the latency target (measured in §8), the required count is `ceil(origin_burst_rps ÷ P) + spare capacity`, spread across at least two failure domains. *Illustration only:* if `P = 150`, T3 needs 27 instances plus spares; the real `P` is unknown until tested.

## 4. Bottlenecks by layer and how each is removed

| Layer | Limit or risk | Mitigation in the design |
|---|---|---|
| CDN miss storm (deploy, purge, new product drop) | Origin load jumps toward the cold-cache column | Stale-while-revalidate at the edge, request coalescing, staged purges, pre-warming of top pages before launches |
| Storefront SSR CPU | Per-instance throughput `P` | Stateless horizontal scaling; streaming SSR; bounded concurrency with fast `503` + `Retry-After` instead of queue collapse |
| Storefront API sub-requests | Shopify cannot tell buyers apart if all calls come from one server IP → throttling | Forward `Shopify-Storefront-Buyer-IP` on every server-side call, as Shopify requires; cache public queries (Hydrogen sub-request cache); private data never cached |
| Checkout creation throttle | Shopify returns `200 Throttled` above its per-minute checkout limit | Client retry with exponential backoff and jitter, as Shopify recommends; clear "high demand" UX; queue page for launches |
| Shopify Admin API | *Verified:* 100 pts/s (Standard), 200 (Advanced), 1,000 (Plus), 2,000 (Commerce Components); 1,000-point max per query ([Admin rate limits](https://shopify.dev/docs/apps/build/apis/graphql-admin/rate-limits)) | Never on the buyer path. Merchant jobs budget points, use bulk operations and back off on throttle |
| Merchant app database (D1) | *Verified:* each D1 database is single-threaded — about 1,000 queries/s at 1 ms per query, 10 GB max size on the Paid plan ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)) | Webhooks land in a durable queue, then idempotent workers write in batches; D1 read replication for reads; per-shop databases or a managed Postgres if measured writes approach the limit |
| Webhook bursts | Order spikes produce webhook spikes; Shopify retries failed deliveries | Acknowledge fast after HMAC verification, enqueue, deduplicate by webhook ID, dead-letter queue with replay |
| Sessions and cart state | In-process state breaks when requests hit different instances | Stateless handlers; cart lives in Shopify; session in signed cookies or a shared store — never instance memory |
| Single host (current frontend) | One VPS is one failure domain | Tier T2+ requires independent hosts or managed container platform across zones/regions (§6) |

## 5. Engineering rules that make scaling a configuration change

These are enforced in code review and, where possible, in tests. Status per rule is tracked in §9.

- **Stateless request handling.** No durable state in process memory; any instance can serve any request.
- **One configuration boundary.** Cache TTLs, timeouts, concurrency limits, upstream URLs and API versions come from typed settings, never literals — so tuning for a larger tier is a config change, not a code change.
- **Public-only caching.** Only anonymous, non-personalised responses are cacheable; cache keys never include cart, customer or session identity. A test must prove private data is never served from shared cache.
- **Timeouts, retries with jitter and retry budgets** on every upstream call; no unbounded retries that amplify an outage.
- **Backpressure over collapse.** When saturated, shed load early with `503` rather than letting queues grow until everything times out.
- **Idempotency** for every mutation and webhook handler.
- **Graceful degradation.** If recommendations or non-critical services fail, shopping and checkout still work.

## 6. Tier-by-tier infrastructure path

| Tier | Target infrastructure | Type of change from previous tier |
|---|---|---|
| **T0 — today** | Static frontend: one container on one VPS behind Cloudflare | — |
| **T1 — 10k** | Hydrogen containers (≥2) behind a load balancer; Cloudflare caching of public pages; external uptime probes | Infrastructure addition; application boundaries from §5 must already exist |
| **T2 — 100k** | Independent hosts in ≥2 availability zones or a managed container platform with autoscaling; shared session/cache store; queue-backed webhooks; centralised metrics and alerting | Infrastructure addition + configuration |
| **T3 — 1M+** | Multi-region origin (US + EU) with health-checked load balancing and failover; autoscaling on CPU and request latency; pre-launch cache warming; Shopify Plus with a coordinated capacity review for planned flash sales; distributed load testing before each major event | Infrastructure addition, provider/commercial change; application code unchanged if §5 holds |

Kubernetes, microservices and sharding are not assumed. They are introduced only when measurement shows a need.

## 7. Cost principle

Each tier adds real cost: more compute, a load balancer, managed state, monitoring retention, egress and possibly a higher Shopify plan. Costs are quoted at procurement time from current provider pricing, not estimated here. No paid resource is provisioned without explicit owner approval.

## 8. How capacity will be proven

A capacity claim takes this form, and only this form:

> "Build **X** sustained **N active sessions / R origin rps** on **infrastructure Y** for **duration D**, at **p95 latency L** and **error rate E**; limitations: **…**."

Test programme (k6, arrival-rate executors, scenarios defined in [WORKLOAD-CONTRACT.md](WORKLOAD-CONTRACT.md)):

1. **Single-instance ceiling** — find `P`, the sustainable rps per storefront instance at the latency target.
2. **Horizontal scaling check** — confirm throughput grows roughly linearly from 1 → 2 → 4 instances.
3. **Cold-cache and stampede test** — purge the cache under load; verify coalescing and shedding hold.
4. **Failure tests** — kill an instance, slow down an upstream, and verify recovery and no retry storms.
5. **Tier tests** — T1 and T2 against staging with stubbed Shopify; T3 only with provider coordination. Shopify, Cloudflare and shared hosts are never flooded without authorization.

CI fails on missed thresholds, dropped iterations or missing scenarios. The current `test-load.yml` workflow is a placeholder that ignores failures (`|| true`) and does not count as evidence until it is replaced.

## 9. Evidence status

| Capability | Status | Evidence / next step |
|---|---|---|
| Checkout, payments and Functions run on Shopify | **By design** | Architecture; hosted checkout is used |
| Static frontend behind Cloudflare with immutable asset caching | **Live** | [FRONTEND-DEPLOYMENT.md](FRONTEND-DEPLOYMENT.md); cache headers in [`deploy/frontend/nginx.conf`](../deploy/frontend/nginx.conf) |
| Typed settings boundary for the storefront | **Built** | Storefront settings unit tests |
| Bounded, public-only Node cache with private-data isolation tests | **Built** | `packages/storefront/tests/unit/cache-node.test.ts`, `hydrogen-node-privacy.test.ts`; integrated acceptance pending |
| Stateless multi-instance storefront behind a balancer | **Planned** | PROJECT_PLAN S02/S05 |
| Buyer-IP forwarding to Storefront API | **Planned** | Required before any load test against Shopify |
| Queue-backed idempotent webhooks | **Planned** | PROJECT_PLAN C07/S03 |
| k6 scenarios with failing CI thresholds | **Planned** | PROJECT_PLAN S04 |
| Measured per-instance throughput `P` | **Not measured** | Test 1 in §8 |
| Highest measured concurrent sessions | **Not measured** | — |
