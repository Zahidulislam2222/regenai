# Workload contract — candidate baseline

Updated: 2026-09-21
Status: design assumptions only. No load test was run and no capacity was measured.

This contract gives future S01/S04 work a reproducible starting point. It describes candidate scenarios, input ownership, acceptance evidence and a local safety proposal. The supervisor has ratified a conservative local-only smoke envelope below; that is not authorization for remote or third-party testing. The master plan owns product workload goals; the reviewed machine-readable profile/config is to own executable smoke limits and thresholds when implemented. Markdown is explanatory and must never be parsed at runtime. Keep its prose synchronized with the validated profile and master plan.

Related sources: [master plan S01/S04 and load-test authorization](../PROJECT_PLAN.md#12b-scalability-workstream-s--credible-path-to-10k1m-active-sessions), [scalability evidence guide](SCALABILITY.md). All profile/config paths are proposed until implemented. This document is not a benchmark, a capacity claim, or approval for remote/high-volume testing.

The executor distinction follows the current [Grafana k6 open and closed workload model documentation](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/) and its guidance on [arrival-rate VU allocation](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/arrival-rate-vu-allocation/) (checked 2026-09-21). Recheck versioned runner documentation when S04 selects its pinned k6 version.

## Terms and baseline model

- **Active session**: one synthetic browser journey currently in progress, with a unique test identity and a defined session timeout. It is not a monthly visitor, registered account, open browser tab, VU count by itself, or checkout mutation.
- **Request rate**: completed or attempted HTTP requests per second, stated at a specific measurement point (generator, edge, application origin, or dependency). Report them separately.
- **Session arrival rate**: new journeys started per second. Session concurrency depends on arrival rate and journey duration; it is not interchangeable with request rate.
- **Closed VU model**: a fixed number of virtual users repeat journeys and wait/think between work. As response time slows, their request rate falls. This is useful for user-concurrency behavior.
- **Arrival-rate model**: the generator schedules iterations independently of response time, requiring enough VUs to keep the requested start rate. Report iterations that could not start (dropped iterations); a clean latency percentile with missed starts is a failed workload result.

Candidate public browsing calculation:

`edge_rps ≈ active_sessions × requests_per_active_session_per_second`

`origin_rps ≈ edge_rps × [dynamic_fraction + (1 − dynamic_fraction) × (1 − public_cache_hit_ratio)]`

This is only a planning approximation. Count asset requests and bytes separately; origin request counts depend on cache policy and route mix. Include bursts, retries, background jobs and dependency calls explicitly. Never use cache-hit assumptions to conceal cold-cache or personalized traffic.

## Candidate local smoke profile

The following is a starting profile, **not a measured customer forecast**. It assumes an isolated local build and deterministic fixtures. It deliberately leaves market share, real route timings and payload distributions as unknowns to replace with observed non-sensitive data or explicitly synthetic decisions.

| Dimension | Candidate assumption | How future maintainers must own/update it |
|---|---|---|
| Journey length | Candidate user journey is up to 30 seconds, with 2–5 seconds of think time between a small number of actions; wait time is part of the journey model, not server processing time. It is not run as part of the primary request smoke profile. | Store journey sequence/distribution/seed in proposed `tests/load/profiles/baseline.json`; record rationale and revision in profile metadata |
| Route mix by journey action | 45% home/collection/product reads; 15% search/filter; 15% quiz/recommendation; 10% cart reads/updates; 5% account read/sign-in test path; 5% checkout initialization; 5% sandbox checkout continuation | Keep weights in profile data. Reconcile to actual enabled features; mark unavailable routes explicitly rather than silently redistributing. Account/checkout shares are journey actions, not shares of total visitors or mutations |
| Dynamic/cache behavior | Public browse requests: candidate 90% warm-cache and 10% cold/miss requests. Personalized/cart/account/checkout paths: private and bypass shared public cache | Profile controls warm/cold proportions; cache tests assert private responses are never served across identities. Add a fully cold-cache scenario |
| Regions | Local baseline has one region and zero network RTT realism. Future regional profiles name generator and target region separately | Region and RTT/packet-loss assumptions belong to profile data; don't call localhost evidence multi-region evidence |
| Payload and egress | Use repository fixture sizes and capture response bytes by route; baseline numbers remain TBD until assets and response sizes are inventoried | Store measured bytes and source commit with each profile revision. Count browser asset transfer separately from API JSON and app-origin egress |
| Dependency calls | Stubbed or controlled local dependencies only for baseline. Record expected calls per route and injected timeout/error behavior | Version the dependency map with profile; live third-party calls require separate target approval and provider limits |
| Burst pattern | Candidate 2× steady arrival for 30 seconds after a 60-second ramp; not a forecast | Keep burst multiplier/duration in profile and report as a separate phase, not averaged away |
| Session identity | Deterministic synthetic IDs; no real accounts, email addresses, health answers or production data | Fixture generator owns clearly synthetic reserved identifiers; test fails if external production host or real PII is present |

The eventual route names must match actual app routes and behavior. Do not create synthetic route handlers or empty profiles just to satisfy this contract. Browser and API workloads may differ; report each independently.

## Primary local request smoke profile

The bounded primary smoke uses short, single-request iterations against the isolated local app and controlled local dependency stubs. Ratified hard maxima: **5 VUs, 2 request starts/second, 60 seconds, and 120 total HTTP requests**, whichever is reached first. Only localhost/project-isolated targets are allowed; zero third-party calls, zero Shopify calls, no shared VPS, no production data, and no paid generator/service. The runner must enforce all four caps and refuse any non-allowlisted host. These limits are a ceiling, not a target to reach.

This primary profile does not claim to model full shopper journey concurrency. Full journey rehearsal is a separate low-volume functional flow: at most 5 sequential synthetic sessions, each with a documented route/action sequence and a maximum elapsed journey duration of 30 seconds, run only when its HTTP request count also remains within the same 120-request ceiling and its request rate remains within 2 starts/second. If meaningful routes cannot complete inside those bounds, revise the journey definition before execution; do not increase the safety envelope implicitly. Record profile ID/revision and actual requests/second for every run.

For machine use, the future validated profile/config is the canonical owner of executable caps and thresholds. Store the profile in proposed `tests/load/profiles/` with schema validation; the runner must reject missing/invalid/duplicated settings. The master plan retains broader product workload goals and authorization boundaries. This document only explains them.

## Rate and concurrency interpretation

For a closed-loop browsing session, request rate depends on action count, response latency, and think time. A rough first estimate is `rps ≈ sessions × actions_per_session / average_session_seconds`; use measured request traces for the actual value. The candidate route proportions above are journey-action proportions, not direct RPS weights if routes have different request fan-out. Record fan-out, retries and cache behavior per route.

For an arrival-rate test, state iteration starts/second, iteration duration, VU allocation/max, and dropped iterations. At steady state, Little’s Law gives a useful consistency check: `concurrent_iterations ≈ iteration_arrival_rate × average_iteration_duration`. It does not substitute for measured active sessions or account for all background browser work. If the generator cannot keep up, the result is invalid for the target arrival rate, even if completed requests look healthy.

Report separately: active sessions/VUs, scheduled and started iterations, attempted/completed/dropped iterations, edge RPS, origin RPS, dependency RPS, request bytes, total egress, and checkout mutations in flight. Never report “10k users” without defining which of these quantities it means.

## Profile and configuration ownership

Proposed ownership after implementation:

- `tests/load/profiles/*.json` owns maintained scenario inputs: routes/weights, session and think-time distributions, cache state, payload references, region/RTT, burst phases and synthetic data seed. Each profile includes `profile_id`, schema version, revision, rationale, source/owner, date and intended target.
- Typed application settings own runtime behavior under test (timeouts, cache TTLs, concurrency limits, feature flags and dependency endpoints). Load profile data must not duplicate those defaults; the runner reads the selected environment/config manifest and records its digest.
- `tests/load/scenarios/` owns executable k6 scenarios and thresholds after S04. Shared numerical scale targets, local safety ceilings, and abort budgets belong in `PROJECT_PLAN.md` as authoritative S01/S04 settings. Do not silently copy or override them in CI YAML, shell scripts or this derived doc.
- Each result artifact records commit, profile revision/hash, config revision/hash, command, target allowlist, generator version, host CPU/RAM, environment, duration, region/cache state, executor model, generator resource saturation, raw summary and reviewer/limitations.

If any intended workload or test setting is absent, invalid, silently defaulted, duplicated, or differs from the master-plan owner, the run must stop or fail closed and report the mismatch. Profile changes require an explicit review and revision; changing a profile to make a failed threshold pass requires a rationale and approval recorded with the change.

## Safety and authorization boundary

The local-only smoke limits above are the ratified ceiling for the initial candidate. Remote, shared-host, higher-volume, longer-duration, third-party or paid-resource testing is outside this contract and needs separate scope, target, provider-policy, cost, abort and cleanup review recorded in the master plan. Free tooling does not remove compute, egress or service costs.

## Tier labels and limits

The plan’s **10k / 100k / 1M+** labels are workload-design scenarios, not established capacity or committed traffic. For each future tier, define active sessions, journey duration/arrival shape, request rate, route mix, cache warm/cold ratio, region, egress, dependency fan-out, concurrent cart/account/checkout actions and failure conditions before selecting infrastructure. Do not extrapolate from a local smoke result or same-host replica test to independent-host availability or end-to-end Shopify capacity.

A future 1M scenario may use the plan’s illustrative public-cache math, but must declare each assumption and separately measure edge, origin and dependency load. Provider limits and checkout capacity require current provider/account evidence. No tier number implies a server size or a guarantee.

## Future acceptance and failure behavior

A future executable S01/S04 suite is meaningful only if it fails closed when a scenario/profile is absent or malformed, required environment/config provenance is missing, target is not explicitly allowlisted, a configured ceiling is exceeded, expected routes are not exercised, the executor misses scheduled work, dropped iterations exceed the profile's reviewed allowance, or latency/error/cache/egress thresholds fail. Runtime caps and thresholds must come from validated machine-readable profile/config data, not Markdown, duplicated YAML or undocumented inline constants. The master plan owns the product workload goal and authorization boundaries; profile revision is recorded with every result.

The report must show p50/p95/p99 latency by route and phase, status/error rate, timeouts, throughput at generator/edge/origin/dependency, cache hit/miss and cold/warm phase, response/request bytes and egress, active VUs/sessions, attempted/completed/dropped work, resource saturation at generator and target, test duration, commit/profile/config provenance and limitations. A test that reports only average latency, omits dropped iterations, or lacks target hardware is insufficient evidence.

Test distinct cases: warm public browse, cold cache, hot product, personalized cache isolation, cart contention, account path, sandbox checkout initiation, slow/down controlled dependency, burst, and one-generator-saturation check. The suite itself should fail when a required case is removed, not silently pass with a placeholder or `|| true`. Stub/local test results establish only the tested software path; they do not establish real provider capacity, production readiness, or 99% uptime.

## Current evidence

No workload profile, k6 scenario, generator run, performance result, or capacity evidence was created by this document. Current status: **contract drafted; profile and executable tests planned; capacity unverified**. Candidate route assumptions are explicitly illustrative and should be revised from the actual feature routes, asset/dependency inventory and observed flows when those are inspected; they are not a forecast and do not need approval as business facts.
