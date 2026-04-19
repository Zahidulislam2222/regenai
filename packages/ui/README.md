# @regenai/ui

RegenAI design system — React + Tailwind v4 + Radix primitives. Clinical-modern aesthetic, WCAG 2.2 AA.

Consumed by:
- `packages/storefront/` — Hydrogen storefront
- `packages/app/` — custom Shopify app admin UI (Day 15+)
- Phase 2 React Native / Expo mobile app (shared component API)

## Install

```bash
npm install @regenai/ui
```

Peer deps: `react >=18.2`, `react-dom >=18.2`, and Tailwind v4 in the consuming app (imports tokens via CSS custom properties).

## Components (v0.1.0)

Button · Input · Select · Checkbox · Radio · Card · Badge · Icon · Dialog · Drawer · Accordion · Tabs · Tooltip · Toast · Popover

Each component:
- TypeScript-typed props (VariantProps from CVA)
- Storybook story (default + variants + states)
- axe-addon WCAG 2.2 AA pass
- Framer Motion integration where motion is part of the UX
- RTL-safe via logical properties

## Design tokens

Tokens are the source of truth — defined in `docs/design-system/brand-tokens.json` at the repo root, mirrored into `packages/storefront/app/styles/tailwind.css` (`@theme` block) and re-exported via `@regenai/ui/tokens` for programmatic access.

## Storybook

```bash
npm run storybook
```

Public deploy on GitHub Pages: `https://zahidulislam2222.github.io/regenai/storybook/` (after CI deploy workflow runs).
