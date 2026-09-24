# Contributing

Thanks for your interest in RegenAI. This is a portfolio project maintained by one developer; issues and focused pull requests are welcome.

## Before you start

- Read [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [BUILD-STATUS.md](docs/BUILD-STATUS.md).
- For anything larger than a small fix, open an issue first so the approach can be agreed.
- Security issues: follow [SECURITY.md](SECURITY.md). Do not open a public issue.

## Setup

```bash
# Node 24 LTS (.nvmrc) and npm 12
npm install

# Visual storefront, no credentials required
npm run dev:frontend

# Shopify Functions (Rust stable + wasm32-wasip1 target)
cd packages/app && cargo test --workspace
```

The root `package-lock.json` owns all npm workspaces. Do not add per-package lockfiles.

## Branches and commits

- `main` is protected: changes land through a pull request with one approving review and linear history.
- Branch names: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `build/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat(storefront): …`, `fix(app): …`, `docs: …`.
- One logical change per pull request.

## Required checks

A pull request should state which of these were run and their result:

| Check | Command |
|---|---|
| Frontend typecheck | `npm run typecheck:frontend` |
| Frontend build | `npm run build:frontend` |
| Storefront unit tests | `npm --workspace packages/storefront run test:unit` |
| Function tests | `cd packages/app && cargo test --workspace` |
| Workspace typecheck / lint / build | `npm run typecheck`, `npm run lint`, `npm run build` (currently known to fail on the unfinished integration — do not make it worse) |

CI also runs secret scanning (gitleaks), CodeQL and SBOM generation; Dependabot proposes weekly dependency updates.

## Rules that are enforced in review

- **No secrets in the repository** — not in code, tests, fixtures, docs or commit history. Use environment variables; `.env.example` holds names and safe placeholders only.
- **No hardcoded configuration** — URLs, API versions, model IDs, timeouts, limits and prices come from typed settings.
- **No private data in logs or telemetry** — tokens, personal data and health-related answers must never be logged.
- **Honest documentation** — a feature is described as live, built, partial or planned according to evidence. Do not claim capacity, uptime, security or compliance that has not been measured or reviewed.
- **Tests for behaviour changes** — including negative tests for authorization and tenant isolation in the merchant app.
- **Accessibility** — interactive UI must be keyboard operable, labelled and respect reduced motion.

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
