# Storefront — `packages/storefront`

The customer-facing frontend of RegenAI. It contains two things that share components and content:

| Part | Entry | Status |
|---|---|---|
| **Visual recovery storefront** — static React build with Three.js product scenes, catalog, search/filter, 6 product pages, recovery finder, demo bag and info pages | `vite.frontend.config.ts`, `preview/`, `app/features/recovery/` | **Live** at https://regenai.zahidul-islam.com |
| **Hydrogen storefront** — server-rendered Shopify storefront (real catalog, cart, accounts) | `server.ts` (Workers), `server.node.ts` (Node), `app/routes/` | **In progress** — route migration and Node adapter not yet passing full gates |

## Commands

Run from the repository root (npm workspaces).

| Task | Command |
|---|---|
| Run visual storefront locally | `npm run dev:frontend` → http://127.0.0.1:3000 |
| Build visual storefront | `npm run build:frontend` → `dist/frontend` |
| Typecheck visual storefront | `npm run typecheck:frontend` |
| Lint visual storefront | `npm --workspace packages/storefront run lint:frontend` |
| Unit tests | `npm --workspace packages/storefront run test:unit` |
| Hydrogen dev server (needs Shopify config) | `npm run dev` |
| Hydrogen build | `npm run build` |
| E2E / accessibility (Playwright) | `npm --workspace packages/storefront run test:e2e` / `test:a11y` |

## Configuration

- Visual storefront: optional `preview/.env.example` (host and port only). No Shopify credentials.
- Hydrogen: copy `.env.example` to `.env` and set Shopify store domain, Storefront API tokens and session secret. Settings are validated by the typed settings module in `app/lib/`; do not read `process.env` directly in feature code.
- Real secrets never go in the repository.

## Layout

```
app/
├── features/recovery/   Visual storefront experience (shell, product scenes, bag, finder)
├── content/             Catalog and UI copy for the demo (fictional products)
├── config/              Typed frontend settings (e.g. bag storage key)
├── routes/              Hydrogen routes (products, collections, search, cart, quiz)
├── lib/                 Settings, Node server, bounded cache, safe logger, SEO helpers
└── components/          Legacy Hydrogen components being migrated
preview/                 Entry for the standalone visual build
tests/unit/              Vitest unit tests
tests/e2e, tests/a11y/   Playwright suites
```

## Behaviour notes

- The demo bag is stored only in the browser (`localStorage`, key `regenai:demo-bag:v1`); nothing is sent to a server.
- Recovery-finder answers stay in page memory and are not saved or sent.
- 3D scenes respect `prefers-reduced-motion`, can be paused, and fall back to still images if WebGL or a model fails.

## Related documentation

[Architecture](../../docs/ARCHITECTURE.md) · [Frontend deployment](../../docs/FRONTEND-DEPLOYMENT.md) · [Frontend review evidence](../../docs/FRONTEND-REVIEW.md) · [Scalability](../../docs/SCALABILITY.md) · [Privacy](../../docs/PRIVACY.md)
