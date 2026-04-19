# ADR-002 — Why Tailwind v4 + shadcn/ui ownership model (over dependency-style libraries)

**Status:** Accepted
**Date:** 2026-04-20 (Day 2)
**Deciders:** Zahidul Islam (solo)
**Supersedes:** —
**Superseded by:** —

---

## Context

The RegenAI storefront (and Phase 4 `@regenai/ui` published package, and Phase 2 mobile app) need a component system that balances:

- Speed of initial build (Phase 1 ships in 45 days with 22 templates)
- Full brand-token customization (clinical tone — `#1E3A5F` deep clinical blue + `#C87A4B` warm terracotta; zero tolerance for "MUI default look")
- WCAG 2.2 AA compliance out of the box (keyboard nav, focus-visible, ARIA)
- TypeScript type-safety for props
- A publishable design-system package (`@regenai/ui`) for use across storefront + custom app + mobile
- Long-term maintainability across 105 days + Phase 2/3

### Alternatives considered

| Option | Why rejected |
|---|---|
| **MUI / Mantine** | Heavy runtime (styled-engine + theme context), opinionated aesthetic hard to override to "clinical modern", bundle-size cost, some a11y gaps on Dialog + Menu primitives we'd need to patch. |
| **Chakra UI** | Same runtime cost; their token system doesn't map cleanly to Tailwind v4 + CSS variable flow we're already locked into. |
| **Radix UI only (no styling layer)** | Unstyled primitives are great but you still need to style every component; choosing to do that + Tailwind v4 = shadcn/ui, which is the actually-correct answer. |
| **Headless UI** (Tailwind Labs) | Limited primitive coverage (no Accordion, no Toast); Radix is more complete. |
| **Radix Themes** | Bundled styling that fights our brand tokens; intentionally opinionated the "wrong way" for RegenAI. |
| **Hand-roll everything on Radix** | Would be cleaner but takes Days 4–8 just for primitives; shadcn/ui's copy-paste + Tailwind ownership gives identical control at ~5× velocity. |
| **Tailwind CSS v3 with `tailwind.config.ts`** | v4 CSS-first (`@theme` directive) removes the config file and generates utilities from CSS variables directly — cleaner, faster, better for our token-driven approach. No reason to stay on v3. |

## Decision

**Adopt Tailwind CSS v4 CSS-first configuration + shadcn/ui component-ownership model.**

Concrete implementation:
1. **Tailwind v4** (already pinned `^4.1.6` by Hydrogen scaffold) — `@theme` directive in `app/styles/tailwind.css` declares brand tokens from `docs/design-system/brand-tokens.json`. Utilities auto-generate (`bg-primary`, `text-accent`, `rounded-md`, `shadow-sm`).
2. **shadcn/ui** via `components.json` config. Components are **copied into `app/components/ui/`** as we need them — not installed as a runtime dependency. We OWN the component code; Radix primitives are installed once (as real deps) and shadcn's opinionated defaults are hand-overridden to match RegenAI brand tokens.
3. **Radix primitives** installed as real deps (`@radix-ui/react-*`) — these handle the accessibility semantics (focus trap, keyboard nav, screen-reader announcements, ARIA attributes, portal rendering). shadcn/ui wraps Radix; we wrap shadcn's wrapper.
4. **Framer Motion** as the motion layer (`app/lib/motion.tsx` — FadeIn, SlideUp, Stagger, all respect `useReducedMotion()`).
5. **`@regenai/ui` package (D4)** re-exports the same shadcn/ui-style components so consumers (storefront + custom app + Phase 2 mobile) use one API.

## Consequences

### Positive
- **Full control.** Every component is code we own, styled with tokens we own. No fighting a library's defaults.
- **No runtime library cost.** Radix primitives are tree-shakeable; Tailwind outputs per-project-used classes. Bundle cost is minimal.
- **WCAG 2.2 AA handled** by Radix primitives (focus management, ARIA, keyboard). We can't regress the a11y even if we try — except via CSS contrast which axe CI catches.
- **Token-driven theming.** Light / dark / high-contrast / RTL all flip via CSS variable overrides in tailwind.css — components never hardcode colors.
- **Publishable to npm.** `@regenai/ui` ships real components with no peerDep tangle (Radix is a real dep of each component).
- **React Native path clear.** shadcn/ui-style component shape (props → className → variants) maps cleanly to a React Native implementation in Phase 2 — the API contract is portable even if the platform primitives change.

### Negative / accepted costs
- **Slightly more upfront work** than `npm install @mui/material` — every component we need is either generated or written. Day 4 budgets 15 components in one sprint; velocity log tracks.
- **Ownership = maintenance.** If Radix updates with new accessibility improvements, we have to manually pull them into our copied components. Dependabot alerts us; ADR-amend if a major API changes.
- **No automatic theme switcher UI.** shadcn/ui ships a light/dark toggle example; we implement our own in `app/lib/theme-provider.tsx` (already done D2.1). Additional code vs getting it "for free", but full control over UX (4-mode: light / dark / high-contrast / system).
- **Learning curve for contributors** unfamiliar with shadcn/ui's "copy-don't-install" pattern. Mitigation: CONTRIBUTING.md documents the mental model explicitly.
- **Tailwind v4 is newer** (released 2024) than v3. Some third-party plugin ecosystem (`@tailwindcss/typography`, etc.) may lag. Mitigation: we self-author what we need; no plugin dependencies in Phase 1.

### Reversibility
High. Swapping Tailwind v4 → v3 is a config-only change (add `tailwind.config.ts`, remove `@theme` block). Swapping shadcn/ui → another system would require rewriting components (but not tokens — those survive). Individual component swap is always trivial since each lives in its own file.
