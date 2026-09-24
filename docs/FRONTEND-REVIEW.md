# Local frontend review — 2026-09-21

The local customer frontend is available for owner review. This is not a production-commerce release. Run `npm run dev:frontend` from the repository root, then open http://127.0.0.1:3000. The server uses a strict port; if occupied, stop the old preview or configure `FRONTEND_PORT` using `packages/storefront/preview/.env.example`.

## Delivered experience

Original Blender models and matching catalog renders; pointer-responsive Three.js hero; bounded native-scroll product inspection; an OpenRouter-generated architectural still; six-product catalog, search/filter/sort, product options, persistent local bag, demo checkout, three-step deterministic recovery finder, and informational/404 views. Responsive layouts, motion pause/reduced-motion views, and product still fallbacks are included. Video is not generated or enabled. The single approved image cost $0.033145; no retry or cap increase.

The preview harness consumes the existing storefront workspace. Phase B must integrate the reviewed components into Hydrogen loaders and real commerce adapters. No production deployment occurred.

## Acceptance evidence

All 12 local criteria F01–F12 were evaluated and met within this scope:

| Criteria | Evidence |
|---|---|
| F01 | Running Vite HTTP preview, dedicated environment boundary, client secret scan clean |
| F02 | Desktop and mobile screenshots inspected; original model label refined after inspection |
| F03 | Chrome scroll in both directions changes inspection chapter; all chapters remain visible with reduced motion |
| F04 | Filter, search, sort, reset and no-results assertions pass |
| F05 | All six product deep links load; option selection/add exercised |
| F06 | Add, quantity, subtotal, refresh persistence, remove, empty state and demo checkout pass; malformed stored data covered by unit tests |
| F07 | Validation, back, restart, results and area-only fallback explanation pass |
| F08 | Mobile dialog and bag Escape/focus checks pass, including restoration to product Add button |
| F09 | About/evidence/policies and unknown-route views exercised; invalid collection handles now reach 404 |
| F10 | Five core routes at 390/768/1440px: no horizontal overflow or missing image; no uncaught page errors |
| F11 | Axe WCAG A/AA checks: zero violations across home/catalog/bag/product/finder/result/mobile states; failed GLB retains still |
| F12 | Gates, audits, independent review and wider-project limitations recorded below |

Browser tooling and screenshots are preserved in the ignored storefront `tests/manual/` directory. Automated unit tests remain in the normal committed test suite. This is Chromium/Chrome verification, not a claim of Safari, Firefox, assistive-technology or low-end-device certification.

## Gates and review

- Storefront unit suite: **34/34 pass**, six files.
- `npm --workspace packages/storefront run typecheck:frontend`: **pass**.
- `npm --workspace packages/storefront run lint:frontend`: **pass**.
- `npm run build:frontend`: **pass**, with upstream ignored `use client` directives and a 542 KB uncompressed Three.js chunk warning. Three is lazy loaded; further performance profiling remains.
- Gitleaks: **no findings** in 60-commit history, selected public working source, or built frontend bundle.
- Bandit: **pass** on the Blender generation script at medium/high severity. There is no new Python web backend. Automatic edit-hook execution was not independently observable; manual scans are the evidence here.
- Fresh-context review: initially requested three fixes (finder fallback wording, actual bag opener focus, unknown collection handles). All corrected. Re-review approved those fixes with no remaining blocking findings; real browser regressions also pass.
- Broader root lint: **pass with four existing React list-key warnings**, zero errors.
- Broader root build: **fails**, Shopify CLI resolves the repository root as the Hydrogen project.
- Broader workspace typecheck: **fails**, including merchant worker Env/virtual-module types and shared UI Storybook types. Full logs retained privately.
- Dependency audit: **69 advisories** (5 low, 13 moderate, 50 high, 1 critical). Critical package: `shell-quote`. No blanket forced upgrades were attempted. These block a production-ready claim.

## Configuration/security audit

- Real secrets found in scanned public source/history/client output: **no**. Legitimate credentials remain in ignored local recovery/environment files; their values were not copied into the preview.
- Moved/centralized: catalog prices/options/product text, interface copy, media configuration, body-map content, cart limits, locale/currency, scene settings and preview host/port. Generation endpoint/model/prompts/spend ledger stay private and server-side.
- Retained fixed implementation constants: SVG geometry, mathematical layout ratios, WebGL projection/light transforms, DOM event names, MIME/protocol strings and route syntax. These define rendering/protocol behavior rather than provider or deployment configuration.
- Added regression tests rejecting obvious secret/provider strings in the new frontend boundary and checking documented/validated preview environment variables.
- Verified ignored and untracked: CREDENTIALS.md, PROJECT-DOSSIER.md, memory, local env files, editable asset sources, manual review tooling.
- This audit covers the new preview and scanned existing public files. It is not a completed architectural refactor of every legacy backend or remote CI secret inventory.

## Next actions

Owner design review first. Then Phase B: reconcile source-level live drift, integrate real Shopify loaders/cart/checkout, remove the temporary preview route harness, fix the broader gates/advisory chains, and repeat acceptance checks against actual adapters before any deployment.
