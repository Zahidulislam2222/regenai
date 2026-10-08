# RegenAI storefront

The customer frontend is live at [regenai.zahidul-islam.com](https://regenai.zahidul-islam.com). Hydrogen serves Shopify catalog data through React Router routes while retaining the original recovery collection design, local fonts and Three.js product scenes. Six owned catalog products, search, category views, comparison, finder, journal and policy pages are available. Public ordering and main-site account sign-in remain closed.

Customer chat uses the same storefront design and the same-origin Python support service. The assistant console lives at `/assistant`; its documented action and privacy boundaries apply to chat too.

## Entrypoints and commands

| Purpose | Entrypoint or root command |
|---|---|
| Hydrogen Node runtime | `server.node.ts`; `npm run dev` / `npm run build` |
| Optional Worker runtime | `server.ts`; separate reviewed deployment |
| Standalone frontend build | `npm run dev:frontend` / `npm run build:frontend` |
| Checks | `npm test`, `npm run typecheck`, `npm run lint` |
| Browser suites | Workspace `test:e2e` and `test:a11y` scripts |

The standalone frontend remains useful for local design work and retained release recovery. It is a separate build from the deployed Hydrogen server. The repository root lockfile controls dependencies.

## Configuration and layout

Copy `.env.example` to a private environment file. The typed modules under `app/lib/` and `app/config/` own runtime settings; maintained data under `app/content/` owns product and business copy. Credentials remain server-only. `app/features/recovery/` contains the shared experience, `app/routes/` the Hydrogen routes and `tests/` the committed automated suites.

Public catalog requests are bounded and private/cart/account responses bypass shared caching. Recovery-finder answers remain in page memory. Normal motion renders the original product model; pause and reduced-motion controls provide a still alternative. Failed WebGL/model loading falls back to an image.

The enabled loopback development-store cart passed quantity changes; public cart mutations remain gated. Account and checkout integration must pass their complete development-store journeys before public ordering changes. Product publication does not establish fulfillment, clinical performance or eligibility to sell.

[Architecture](../../docs/ARCHITECTURE.md) · [Deployment](../../docs/FRONTEND-DEPLOYMENT.md) · [Support](../../docs/ASSISTANT.md) · [Accessibility](../../docs/ACCESSIBILITY.md) · [Capacity](../../docs/SCALABILITY.md)
