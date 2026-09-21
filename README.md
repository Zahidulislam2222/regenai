# RegenAI

RegenAI is a client-facing Shopify recovery-commerce demo. The selected customer experience uses original Blender assets, Three.js product views and a bone-and-blue visual design. The new visual frontend is live at **https://regenai.zahidul-islam.com**. Full Shopify integration is paused and incomplete; see [build status](docs/BUILD-STATUS.md) for verified work and remaining gates.

The live visual demo and local design preview use synthetic products and a browser-local bag. Integration with real Shopify development-store catalog, cart, accounts and test checkout is planned. This project does not accept real payments or establish clinical efficacy or legal compliance.

**Stack at a glance:**
- **Customer experience** — React, TypeScript, Three.js and an isolated Vite design preview; Hydrogen/React Router integration underway.
- **Hosting target** — Hydrogen on a Node server behind Cloudflare; the static visual demo is deployed, while integrated Node/Hydrogen acceptance remains pending. Existing Oxygen/Worker tooling remains during migration.
- **Merchant app** — React Router on Workers/D1; authentication and tenant-isolation repairs remain release gates.
- **Shopify Functions** — Rust/WASM extension sources; current capability, runner and checkout validation required.
- **Design system** — local `@regenai/ui` workspace with Storybook; publication is not claimed.
- **Recommendations and operations** — deterministic demo finder exists; optional AI, connected telemetry and recovery controls follow explicit implementation and verification tasks.

The [scalability guide](docs/SCALABILITY.md) maps required code boundaries, tests and infrastructure upgrades toward 10k–1M+ active sessions and a 99% availability objective. These are design targets, not tested capacity or observed uptime. Its evidence table distinguishes planned work from implemented and measured behavior.

## Repository layout

```
regenai/
├── packages/
│   ├── storefront/       # Hydrogen storefront (active)
│   ├── app/              # Merchant app and Rust extension workspace
│   └── ui/               # Shared components and local Storybook
├── docs/                 # Plans, evidence guides and historical ADRs
└── .github/workflows/    # Existing workflows; release-gate repairs planned
```

## Quickstart

Run these commands from the repository root. The root `package-lock.json` owns all npm workspaces; separate workspace lockfiles are not maintained.

```bash
# Node 24.20.0 LTS (see .nvmrc); npm 12.0.2
npm install

# Review the selected frontend without Shopify credentials
npm run dev:frontend

# Typecheck all workspaces
npm run typecheck

# Lint all workspaces
npm run lint
```

## Environment

Use `.env.example` as the safe configuration inventory. The separate `npm run dev` command starts the Hydrogen integration environment and requires its Shopify/session configuration. Keep real values in ignored local environment files and the private credential recovery record. Fresh-install reproducibility and dependency security are still under verification; current limitations are recorded in build status.

## Checkpoint status

This branch preserves the verified standalone frontend and unfinished integration work. It is not a production-ready Shopify release; full-runtime and commerce gates remain open.

## Documentation

Client-facing overview: [vision, delivery status and roadmap](my-project-view/technical-overview.md).

Full docs live in [`docs/`](./docs). Key documents:
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) — dependency-ordered completion plan
- [Build status](docs/BUILD-STATUS.md) — current evidence and next gates
- [Scalability guide](docs/SCALABILITY.md) — implementation evidence required for scaling claims
- [docs/adr/](./docs/adr/) — architecture decision records
- [Production applicability](docs/PRODUCTION-APPLICABILITY.md) — demo controls and real-sales prerequisites
- [Workload contract](docs/WORKLOAD-CONTRACT.md) — scenario definitions and bounded local validation

## License

MIT — see [LICENSE](./LICENSE). Brand assets and content are separate and not MIT licensed.

## Local frontend design review

Run `npm run dev:frontend` and open http://127.0.0.1:3000 in Chrome. This starts the customer concept storefront without Shopify credentials. `npm run build:frontend` builds the preview. Product choices persist locally; checkout does not collect payments.

See [frontend review evidence](docs/FRONTEND-REVIEW.md) for tested scope, production limitations and restart details. Existing `npm run dev` remains the separate Hydrogen development command.
