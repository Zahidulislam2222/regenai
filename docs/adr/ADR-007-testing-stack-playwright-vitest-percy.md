# ADR-007 — Testing stack: Playwright + Vitest + Percy + Storybook

**Status:** Accepted  **Date:** 2026-04-20 (Day 3)  **Supersedes:** —

## Context

RegenAI Phase 1 ships 22 routes, a custom app (D15+), 4 Shopify Functions, and an ML pipeline. Tests must cover:
- E2E golden paths (ATC, quiz → recommendation, B2B inquiry, PDP → cart drawer)
- Unit logic (token computation, recommendation ranking, contraindication rules)
- Component rendering (@regenai/ui — all 15 components)
- Accessibility (WCAG 2.2 AA on every route)
- Visual regression (prevent CSS-refactor regressions across 22 routes)
- Performance budgets (Lighthouse)
- Contract (Storefront GraphQL schema drift)
- Load (quiz + recommendation endpoints, nightly)

## Decision

| Layer | Tool | Why |
|---|---|---|
| E2E | **Playwright** | First-class Shopify dev-store support, retry + trace + video debug, multi-browser matrix free, no Cypress license anxiety |
| Unit + component | **Vitest** | Vite-native (same build pipeline as storefront), Jest-compatible API, 5× faster than Jest for the same project |
| A11y | **axe-core via @axe-core/playwright** | Reuses Playwright infra, runs in CI, 0 false positives with proper tag filters |
| Visual regression | **Percy (only)** | Reused from Kindred Grove account; single vendor for visual-diff (Chromatic rejected — duplicate tool for same job) |
| Perf budgets | **Lighthouse CI** | Industry-standard, budget.json assertions, perf + a11y + SEO + best-practices in one run |
| Contract | **GraphQL Code Generator + Vitest diff** | Generates types from live schema; git diff catches drift |
| Load | **k6** | OSS, k6-cloud-free-tier covers portfolio scale |
| Storybook | **Storybook** static on GitHub Pages | Component docs + a11y addon; static build deploy free |

## Alternatives rejected

- **Cypress** — license + commercial-use restrictions; Playwright is better-supported for cross-browser.
- **Chromatic** — duplicates Percy; `PERCY_TOKEN` already wired. Skipping saves an integration + secret.
- **Jest** — slower than Vitest on Vite projects; no reason to keep two test runners.
- **Pa11y** — axe-core + Playwright is a superset.
- **Checkly** — replaced by Cloudflare Worker cron (Day 35) for synthetic uptime; saves a signup.

## Consequences

**+** Single visual-regression vendor = single baseline source of truth.
**+** Vitest unit + Playwright E2E share config patterns; team members switch contexts without friction.
**+** axe-core a11y runs on every PR, catches regressions before merge.
**+** Testing-Library matchers in Vitest setup.ts; DOM assertions idiomatic.
**−** Percy free tier = 5k snapshots/mo; at 22 routes × 2 viewports × every-PR that caps around 100 PRs/mo. Sufficient for portfolio; monitor.
**−** Lighthouse CI needs a live URL to test against — the CI job spins up `npm run preview` for local-run; in CI, targets the Oxygen preview. Setup documented in workflow.

**Reversibility:** High. Each tool is replaceable independently.
