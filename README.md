# RegenAI

Four-layer Shopify Plus commerce platform for a pre-launch DTC wellness brand spanning physiotherapy → sleep/mental/stress → full wellness (nutrition, AI monitoring, home gym, women's health, anti-aging).

**Stack at a glance:**
- **Storefront** — Hydrogen (React + Remix + TypeScript) on Oxygen
- **Custom app** — Remix on Cloudflare Workers + D1
- **Shopify Functions** — Rust/WASM (cart contraindication, B2B pricing, delivery, discount stacking)
- **Data + ML** — RudderStack → BigQuery → dbt + pgvector on Supabase + Claude/OpenAI embeddings
- **Design system** — [`@regenai/ui`](./packages/ui) published npm package, Storybook on GitHub Pages
- **Observability** — Sentry distributed tracing + Web Vitals RUM + Cloudflare Worker cron synthetic

## Repository layout

```
regenai/
├── packages/
│   ├── storefront/       # Hydrogen storefront (active)
│   ├── app/              # Remix custom app on Cloudflare Workers (Day 15+)
│   ├── functions/        # Shopify Functions in Rust (Day 16+)
│   └── ui/               # @regenai/ui design system (Day 4+)
├── docs/                 # Architecture, ADRs, compliance, API spec, runbook
└── .github/workflows/    # 16 CI workflows (lint, test, a11y, perf, sec, compliance, deploy)
```

## Quickstart

```bash
# Node 20.18.0 recommended (see .nvmrc)
npm install

# Dev the storefront (Oxygen preview against regenai.myshopify.com)
npm run dev

# Typecheck all workspaces
npm run typecheck

# Lint all workspaces
npm run lint
```

## Environment

Copy `.env.example` to `.env` and populate with Partner Plus Dev Store credentials + downstream service tokens. Required vars are documented in [`docs/CI-SECRETS.md`](docs/CI-SECRETS.md) (local-only).

## Documentation

Full docs live in [`docs/`](./docs). Key documents:
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) — 105-day multi-phase build plan
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — 4-layer architecture
- [docs/adr/](./docs/adr/) — architecture decision records
- [docs/COMPLIANCE.md](./docs/COMPLIANCE.md) — FDA / DSHEA / WCAG 2.2 AA posture

## License

MIT — see [LICENSE](./LICENSE). Brand assets and content are separate and not MIT licensed.
