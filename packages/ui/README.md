# `@regenai/ui` — design system

Shared React components for RegenAI — most built on Radix primitives — styled with Tailwind CSS v4. Accessibility target: WCAG 2.2 AA.

**Status:** built and used locally through npm workspaces. The package is not published to npm.

## Components (v0.1.0)

Button · Input · Select · Checkbox · Radio · Card · Badge · Icon · Dialog · Drawer · Accordion · Tabs · Tooltip · Toast · Popover

Components have typed props; Badge, Button and Toast expose variants via class-variance-authority. Storybook stories exist for Badge, Button, Card and Input; stories for the remaining components, automated component tests and right-to-left layout support are planned.

## Usage inside this monorepo

```tsx
import {Button} from '@regenai/ui';
```

Peer dependencies: `react >= 18.2`, `react-dom >= 18.2`, and Tailwind v4 in the consuming app. Design tokens are exposed as CSS custom properties and through `@regenai/ui/tokens`.

## Commands

Run from the repository root:

| Task | Command |
|---|---|
| Build | `npm run ui -- build` |
| Typecheck | `npm run ui -- typecheck` |
| Storybook (local) | `npm run ui -- storybook` → http://localhost:6006 |
| Static Storybook build | `npm run ui -- build-storybook` |

Storybook is not currently published online.

## Related

[Architecture](../../docs/ARCHITECTURE.md) · [Accessibility](../../docs/ACCESSIBILITY.md) · [ADR-002 — Tailwind + shadcn ownership](../../docs/adr/ADR-002-why-tailwind-shadcn-ownership.md) · [ADR-005 — design-system package](../../docs/adr/ADR-005-regenai-ui-published-package.md)
