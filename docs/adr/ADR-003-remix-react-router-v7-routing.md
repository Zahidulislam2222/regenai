# ADR-003 — Remix / React Router v7 file-based routing

**Status:** Accepted  **Date:** 2026-04-20 (Day 3)  **Supersedes:** —

## Context

Hydrogen 2026.4.0 ships on React Router v7 (Remix merged upstream). RegenAI needs:
- 22 routes across 5 locales + 5 markets (via subfolder URL strategy)
- Typed loader → component data flow (avoid `any` in PDP/PLP data)
- Streaming SSR with deferred data (hero above fold must LCP < 2s; heavier below-fold can defer)
- Error boundaries per route
- Cookie + header-based theming SSR (no flash of unstyled theme on Day 2.3)
- Custom Remix app (D15+) on Cloudflare Workers using the same routing conventions (shared mental model)

## Decision

Use **React Router v7 file-based routing** (`app/routes/*.tsx`) throughout the storefront. No manual `routes.ts` hand-definitions except for programmatically generated locale-prefix routes.

Conventions:
- Loaders/actions typed via the auto-generated `./+types/<route>` virtual module (resolved at build by `react-router typegen`).
- `useLoaderData<typeof loader>()` for type-safe route data.
- `defer()` for below-the-fold queries (header footer, origin pages' secondary content).
- `shouldRevalidate` exported per-route where non-mutation revalidation would waste Storefront API budget.

## Alternatives rejected

1. **Manual route config (`routes.ts`)** — fine for small apps, gets brittle across 22 routes + 5 locales. File-based conventions + typegen are the path of least surprise.
2. **TanStack Router** — great type-safety but Hydrogen is built on React Router; swapping means leaving Hydrogen's loader context + Oxygen caching.
3. **Next.js App Router** — not on Hydrogen; already rejected in ADR-001.

## Consequences

**+** Typegen eliminates prop-type mismatch between loader + component.
**+** Streaming SSR + defer pattern yields sub-2s LCP even on content-heavy PDPs.
**+** Shared routing mental model between storefront + custom app (D15+).
**−** Virtual types fail naive `tsc --noEmit`; `npm run codegen` resolves. Documented in root CONTRIBUTING + CI (`lint.yml` runs `typecheck` which includes `react-router typegen`).
**−** File layout hard-codes URL structure; moving routes is a rename + reference-update chore.

**Reversibility:** Low-medium. Route file paths determine URLs; changes cascade.
