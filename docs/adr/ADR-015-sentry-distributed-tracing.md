# ADR-015 — Sentry distributed tracing over standalone OTel + Honeycomb

**Status:** Accepted  **Date:** 2026-04-20 (Day 3)  **Supersedes:** Earlier plan to use Honeycomb + OTel collector.

## Context

The RegenAI plan originally scoped observability as:
- Errors → Sentry
- Traces → OpenTelemetry SDK → Honeycomb free tier
- RUM → Grafana Faro / Honeycomb

Three vendors, two configs, one trace-context propagation story. During pre-flight we identified that Sentry's distributed tracing now covers the same ground:
- Browser → loader → server → downstream HTTP traces in a single trace ID
- Web Vitals integration via `Sentry.setMeasurement(...)`
- Performance dashboards + error linking built-in
- One auth token, one vendor, one dashboard

## Decision

**Consolidate on Sentry for errors + traces + RUM.** Drop Honeycomb signup. Cloudflare Workers Logs handles structured logs from the custom app (D15+) and forwards failures to Sentry via breadcrumbs.

Concrete stack:
- `@sentry/react` (storefront client + route perf)
- `@sentry/node` (Hydrogen server, Worker context)
- `web-vitals` library → `Sentry.setMeasurement(...)` for LCP/CLS/INP/FCP/TTFB
- Cloudflare Workers `console.log`/`console.error` → `wrangler tail` for dev; Workers Logpush → Sentry breadcrumb buffer for staging/prod

## Alternatives rejected

1. **OTel + Honeycomb + Sentry** — three vendors for overlapping capability. Trace-context propagation across a single-vendor stack is less error-prone.
2. **Datadog APM** — paid from day one, overbuilt for portfolio scale.
3. **Grafana Cloud + Tempo + Loki** — free tier is generous but requires agent + collector config overhead that Sentry eliminates.
4. **Self-hosted Jaeger** — no free-tier concerns but infra overhead I'd have to maintain.

## Consequences

**+** One vendor. One secret. One dashboard.
**+** Error → trace correlation is automatic.
**+** Sentry free tier: 5k errors + 10k performance events + 50 replays (replays off Phase 1) = sufficient for portfolio traffic.
**+** 4 projects under the existing `zahidul-islam-7l` org → storefront, app, worker, mobile — consolidates portfolio observability into one org pane.
**−** Lock-in. If Sentry changes pricing, migrating to OTel + Honeycomb is a non-trivial swap. Mitigation: keep trace emission via official SDKs (not Sentry-proprietary APIs) so migration is achievable in Phase 2+ if needed.
**−** Some advanced tracing features (custom sampling by user property) are Sentry paid-tier. Portfolio doesn't need them; flag if requirements grow.

**Reversibility:** Medium. Error events are harder to migrate than traces (they carry vendor-specific context); traces could re-route to OTel without changing application code.
