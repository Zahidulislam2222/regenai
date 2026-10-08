# Storefront — `packages/storefront`

The customer-facing frontend of RegenAI. It contains two things that share components and content:

| Part | Entry | Status |
|---|---|---|
| **Visual recovery storefront** — static React build with Three.js product scenes, catalog, search/filter, 6 read-only product pages, recovery finder and info pages | `vite.frontend.config.ts`, `preview/`, `app/features/recovery/` | **Live design-study preview** at https://regenai.zahidul-islam.com; cart ordering is closed |
| **Hydrogen storefront** — server-rendered Shopify storefront (six published product products and guarded local Your cart) | `server.ts` (Workers), `server.node.ts` (Node), `app/routes/` | **Local F1 candidate** — desktop/mobile shopping flow passes; older closed-ordering version is on isolated staging; account and test checkout remain gated |

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

- The preview bundle includes a local-only application bag implementation (`localStorage`, key `regenai:demo-bag:v1`), but its current public product pages expose no Add action and the cart page states that ordering is closed.
- The Hydrogen cart uses Shopify's development store only behind explicit loopback development environment settings; its line changes are sent to Shopify and its checkout link is restricted to the configured checkout host.
- Recovery-finder answers stay in page memory and are not saved or sent.
- 3D scenes respect `prefers-reduced-motion`, can be paused, and fall back to still images if WebGL or a model fails.

## Related documentation

[Architecture](../../docs/ARCHITECTURE.md) · [Frontend deployment](../../docs/FRONTEND-DEPLOYMENT.md) · [Frontend review evidence](../../docs/FRONTEND-REVIEW.md) · [Scalability](../../docs/SCALABILITY.md) · [Privacy](../../docs/PRIVACY.md)
