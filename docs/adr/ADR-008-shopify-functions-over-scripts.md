# ADR-008 — Shopify Functions over Scripts for checkout logic

**Status:** Accepted
**Date:** 2026-04-20 (Day 16)
**Layer:** 3 — Checkout-time logic (PROJECT_PLAN §4)
**Applies to:** D16 cart-contraindication, D17 B2B tiered pricing, D18 delivery customisation, D19 discount stacking — plus future age-gate (Phase 3)

## Context

RegenAI's checkout needs four pieces of logic that can't live in the storefront alone because they must execute *after* cart submission, within the Shopify checkout pipeline, and cannot be bypassed by a hostile client:

1. **Cart contraindication block** — stop a pacemaker-flagged customer from purchasing a TENS device even if they bypass the storefront UI.
2. **B2B tiered pricing** — discount based on Company metafield tier (bronze / silver / gold / platinum) + cart subtotal.
3. **Delivery customisation** — hide express shipping on FDA Class II devices; force signature-required on TENS/EMS/peptide orders.
4. **Discount stacking rules** — allow subscription + first-time + clinic codes to stack, capped at 40% total (PROJECT_PLAN §6).

Each of these is a well-formed "take structured cart input, return structured decision" function. They need to run sub-100ms at checkout, must be deterministic, and must be auditable after the fact (compliance-as-code gate per ADR-016).

## Decision

**Use Shopify Functions (Rust → WASM) for all four, not Shopify Scripts or App Proxy workarounds.**

Function targets:
- D16 cart-contraindication → `cart.checkout.validation.run`
- D17 b2b-tiered-pricing → `cart.transform.run`
- D18 delivery-customization → `delivery_customization.run`
- D19 discount-stacking → `cart.checkout.validation.run` (stacking rules live in a validation function that rejects non-compliant discount combinations)

All live under `packages/app/extensions/<name>/` as independent Rust crates, unified by a Cargo workspace at the repo root. Compiled with `wasm32-wasip1` target. Each has a `shopify.extension.toml` declaring its target + input query + output schema.

## Alternatives rejected

1. **Shopify Scripts (Ruby, legacy).** Rejected — deprecated by Shopify in favour of Functions. No new features on the Scripts platform. Portfolio value rewards the current stack.

2. **Admin API-based discount rules** (dynamic code at checkout via price-rule + discount-code combos). Rejected — can't model contraindication logic or tier-matrix pricing. Also executes at the API layer, not checkout; attackers can bypass with direct API calls.

3. **App Proxy endpoint** (custom HTTP route the storefront consults at cart/checkout time). Rejected — adds an external network hop, introduces a failure mode where checkout silently continues if the proxy times out. Functions run inside Shopify's checkout sandbox, no external call, no timeout-softness.

4. **Client-side-only enforcement in the storefront** (JS blocks add-to-cart on contraindication conflict). Rejected — bypass-able with direct cart URL / Storefront API / Postman. Compliance-as-code (ADR-016) requires server-side enforcement that survives hostile clients.

5. **JavaScript Functions instead of Rust.** Rejected for two reasons:
   - Rust compiles to a tiny, deterministic WASM bundle — Shopify's free tier caps WASM size; JS bundles bloat faster.
   - Portfolio value — Rust Functions are the Shopify-recommended path + less common in portfolios than JS; they signal depth.
   - Trade-off accepted: writing Rust is slower than JS, and the first-time cost of rustup + target install is real. ADR-006 multi-assistant governance allocates component-scaffolding to the AI agent with Rust context, which amortises that cost.

## Consequences

**Positive**
- Server-side enforcement — contraindication block + tiered pricing + delivery filter + discount cap all survive hostile client attempts.
- Sub-100ms execution per Function (Shopify's runtime target for the WASM sandbox).
- Compliance-as-code — each Function is a reviewable + testable unit of business rule with Rust `cargo test` coverage.
- One publish pipeline — `shopify app deploy` ships all 4 Functions together as extensions of the same Custom App (ADR-021 packages/app).

**Negative**
- Rust toolchain dependency for every dev (`rustup` + `wasm32-wasip1` target). One-time install.
- Each Function must be kept under Shopify's WASM size limits (~1.5 MB per extension); precludes pulling in large crates like regex-automata or polars.
- Function targets evolve — Shopify occasionally renames or deprecates targets. Monitor the Shopify developer changelog; pin target versions in `shopify.extension.toml`.
- Input query shapes evolve with the Storefront API version; contract-test workflow (`test-contract.yml`) surfaces drift.

## Reversibility

**Medium.** The business rules are the portable asset — expressed as Rust functions they're easy to port to JavaScript Functions, a Lambda behind an App Proxy, or a Rails Script (if Shopify ever revived that). The `packages/app/extensions/*/tests/` Rust tests serve as a specification that any alternate implementation would need to satisfy.

## Workspace structure

```
packages/app/
├── Cargo.toml              # workspace root
├── extensions/
│   ├── cart-contraindication/
│   │   ├── Cargo.toml
│   │   ├── shopify.extension.toml
│   │   ├── input.graphql
│   │   └── src/main.rs
│   ├── b2b-tiered-pricing/
│   ├── delivery-customization/
│   └── discount-stacking/
└── extensions-shared/      # shared types: ClaimTaxonomy, Tier, ContraFlag
    └── src/lib.rs
```

Workspace Cargo.toml lets all 4 crates compile with a single `cargo build --release --target wasm32-wasip1`. Shopify CLI's `shopify app deploy` picks up each extension by its `shopify.extension.toml`.

## References

- Shopify Functions documentation — targets + input queries + deployment
- PROJECT_PLAN.md §4 (Layer 3), §6 Phase-1 features
- ADR-016 — compliance-as-code (parent gate)
- ADR-021 — the packages/app that hosts these extensions
