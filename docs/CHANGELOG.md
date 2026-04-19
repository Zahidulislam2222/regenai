# Changelog

All notable changes to RegenAI documented here. Follows [Keep a Changelog](https://keepachangelog.com/) format.

## [Unreleased]

## [0.1.0] — Week 1 foundation (Days 1–7) — 2026-04-20

### Added
- Monorepo (npm workspaces) with `packages/storefront/` (Hydrogen 2026.4.0) + `packages/ui/` (`@regenai/ui` design system).
- Root: `package.json`, `.gitignore`, `.gitattributes` (LF norm), `.editorconfig`, `.nvmrc` (Node 20.18.0), LICENSE (MIT + Content exclusion), README.
- Hydrogen scaffold: React Router 7.12 + Tailwind v4 CSS-first + TypeScript strict + i18n subfolder markets (en/es/fr/de/ar).
- Tailwind v4 `@theme` block with 50+ brand tokens mirrored from `docs/design-system/brand-tokens.json`.
- `app/lib/theme-provider.tsx` — light/dark/high-contrast/system modes with localStorage persistence + live `matchMedia` tracking.
- `app/lib/tokens.ts` + `@regenai/ui/tokens` — typed token surface for React.
- `app/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `focusRing`, `srOnly`, `assertDefined`.
- `app/lib/motion.tsx` — `FadeIn`, `SlideUp`, `Stagger`, `StaggerItem` respecting `useReducedMotion()`.
- shadcn/ui configured via `components.json`; 12 Radix primitives as real deps.
- CSP via Hydrogen `createContentSecurityPolicy` + extra security headers (HSTS, Referrer-Policy, X-Content-Type-Options, X-Frame-Options, X-DNS-Prefetch-Control, Permissions-Policy).
- Skip-link + `<main id="main-content">` for WCAG 2.2 AA.
- `@regenai/ui@0.1.0` — 15 components (Button, Input, Select, Checkbox, Radio, Card, Badge, Icon, Dialog, Drawer, Accordion, Tabs, Tooltip, Toast, Popover) with Storybook stories + a11y addon config + Framer Motion wrappers.
- 16 GitHub Actions workflows: lint, test-unit, test-e2e, test-a11y, test-visual (Percy), test-contract, test-load, lighthouse-ci, sast (CodeQL), dast (ZAP), sbom (Syft), secret-scan (gitleaks), compliance-lint, deploy-preview, deploy-staging, deploy-production (with environment reviewer gate).
- Dependabot config — weekly, vendor-grouped (Hydrogen / React / Tailwind / Radix / testing / linting / security / fonts).
- Sentry × 4 projects (storefront / app / worker / mobile) under `zahidul-islam-7l` org; `@sentry/react` + `web-vitals` wired via `app/lib/sentry.client.ts` with PII scrubbing.
- Test configs: `playwright.config.ts`, `vitest.config.ts`, `tests/setup.ts`, smoke tests for home + tokens + a11y (WCAG 2.2 AA).
- BrandedHeader (sticky, 6-item nav, 5-locale switcher, cart count, mobile drawer) + BrandedFooter (trust strip + 4 link columns + newsletter + FDA disclaimer) + AnnouncementBar (dismissible, localStorage-cookied, 3 tone variants).
- Home blocks: Hero (streaming SSR + dual CTA), TrustStrip, FeaturedCollections, ClinicianQuote.
- `app/lib/seo/jsonld.ts` — typed builders for Organization, Breadcrumb, Product (with `MedicalDevice` @type extension + `medicalDeviceClass`), FAQ, HowTo, MedicalWebPage; `<JsonLd>` helper.
- `/robots.txt` route — sitemap pointer + bot rules.
- `/pages/styleguide` route — in-context component library for Lighthouse + axe audit.
- 6 ADRs: Hydrogen-over-Liquid, Tailwind-v4-+-shadcn, Remix-RR7-routing, Oxygen-+-CF-fallback, `@regenai/ui`-published, multi-assistant-governance, testing-stack, Sentry-tracing (ADR-001/002/003/004/005/006/007/015).
- Private docs (gitignored): BRAND-BRIEF, SOW, BUILD-LOG, RESUME, design-system/brand-tokens.json.
- CI all-green achieved on `b4794d0` (iterative fix commits documented in BUILD-LOG).

### Fixed
- Monorepo root lock file missing (`npm install` at root generates).
- `tests/*.ts` TypeScript parser scope (added to tsconfig include).
- ESLint `eslint-plugin-jest` detection failure on Vitest-using repo (tests ignored in ESLint config).
- lightningcss cross-platform binary issue on Windows-generated lock vs Linux CI (direct `tsc --noEmit` + skipLibCheck as interim; lock regenerate on Linux scheduled for Day 8+).
- Lighthouse CI gated on `OXYGEN_DEPLOYMENT_TOKEN` (blocked on interactive Hydrogen-storefront creation).
- Sentry org slug typo `zahidul-islam-71` → `zahidul-islam-7l` (letter L, not digit 1).

### Security
- 30+ secrets dual-written (`.env` + GitHub Actions Secrets) on every new credential.
- Branch protection on `main`: required PR + 1 review, linear history, no force push, conversation resolution required.
- gitleaks CI on every PR + weekly deep history scan.
- Sentry `beforeSend` PII scrubber for `email`/`token`/`auth`/`hk_id`/`biomarker_id`/`protocol_token` params.
