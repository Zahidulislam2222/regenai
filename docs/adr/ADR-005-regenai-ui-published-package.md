# ADR-005 — `@regenai/ui` as published npm package (vs workspace-only)

**Status:** Accepted  **Date:** 2026-04-20 (Day 4)

## Context
`@regenai/ui` (15 components) is consumed by the storefront (Hydrogen), the custom Shopify app admin UI (Day 15+), and the Phase 2 React Native mobile app. Three options for distribution:

1. Workspace-only (never published) — `packages/ui/*` imported directly via npm workspaces `file:` resolution.
2. Private npm package — published under `@regenai/ui` but only the user's npm account can install.
3. Public npm package on `@regenai` org (free tier).

## Decision
**Option 3 — public npm package, `@regenai/ui@0.1.0+` on `npmjs.com/@regenai`.**

Rationale:
- **Portfolio signal**: a published, versioned npm package with Storybook docs is a senior-staff signal an agency reviewer can browse in under 60 seconds.
- **Agency-tier pattern**: shared design systems ship as npm packages so any new team / repo / client project can `npm install @regenai/ui` without access-gating setup.
- **Phase 2 mobile app path**: React Native app will be in a separate repo eventually; workspace-only forces a monorepo forever.
- **Version history = change log**: npm's version history doubles as an audit trail for component API changes.
- Free tier covers unlimited public packages under the `@regenai` org.

## Alternatives rejected
- **Workspace-only** — loses portfolio signal + Phase 2 mobile path. Reconsidered + confirmed no.
- **Private package** — $7/month for npm Teams + restricts reviewer access. Pays nothing to go public.
- **GitHub Packages** — works, but npmjs.com is where reviewers look. Same-effort, worse discoverability.

## Consequences
**+** Shopify-agency reviewer can `npm install @regenai/ui` with no access setup.
**+** Storybook deploys to GitHub Pages become the live component gallery URL we reference in the case study.
**+** `peerDependencies: {react: ">=18.2"}` keeps consumers honest about React version.
**−** Every API change needs a semver decision; we maintain a CHANGELOG (`packages/ui/CHANGELOG.md`, Day 7).
**−** Accidental secret leak via committed stories / props is a public-package concern — `gitleaks` CI + Dependabot cover this.

**Reversibility:** High. Unpublish within 72h; remove `publishConfig.access`; continue as workspace-only.
