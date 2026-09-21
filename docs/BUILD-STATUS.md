# Build status

Updated 2026-09-22. **Full integration remains paused. The owner has now authorized publishing the selected standalone frontend for live review; the visual demo is live at https://regenai.zahidul-islam.com.** Derived from the private project dossier and [master plan](../PROJECT_PLAN.md).

| Workstream | Current evidence | Next gate |
|---|---|---|
| A — frontend | Owner selected the newly built recovery design | Preserve during Hydrogen integration |
| B — foundation | B02 builds/type/lint/34 tests passed and Storybook checked in Chrome; first B03 dependency update installed with a valid dependency tree; audit reduced 69→63, critical 1→0 | Clean install passed; subsequent config/type fixes pass Windows checks and review; Linux check passed 8/10 gates, including 48 tests; offline CLI build and preset lint failures under repair. Node runtime tests pass 20/20; shared frontend SSR preparation reviewed with Chrome shopping/motion/3D checks passing; framework route integration active; remaining advisories open |
| C–F — integration and release | Existing scaffolds and live artifacts inventoried; no new release | Capability, security, sandbox flows and release gates |
| P — production controls | Demo scope clarified; applicability register reviewed | Implement and verify applicable controls |
| S — scale architecture | Local Docker available; local Kubernetes node Ready; workload contract reviewed | Implement used boundaries and bounded tests |

This is a client-facing portfolio demo. New features, legal compliance, observed uptime and traffic capacity are not claimed complete. Paid actions and publication retain explicit approval gates. Existing live services have not been modified.

Recovery notes and before/after task evidence are maintained locally in the private project memory directory. Each completed task needs check results and an independent review; an interrupted task remains unverified.

At stop: the selected visual demo has earlier passing browser/component evidence. The Node runtime and Hydrogen route migration remain unfinished; the latest cache-test correction has not been rerun. Full commerce, production controls and release acceptance are outstanding. Rough engineering estimate: 15–20% of full scope, 80–90% of visual demo work; these are estimates, not verified task completion rates.

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
