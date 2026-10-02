# Shopify Functions

Four Rust crates compiled to WebAssembly and run by Shopify inside cart and checkout. They execute on Shopify's infrastructure, so they add no load to RegenAI servers. Shared helpers live in [`../extensions-shared`](../extensions-shared).

| Function | Target | Behaviour | Unit tests |
|---|---|---|---:|
| [`cart-contraindication`](cart-contraindication/) | `cart.checkout.validation.run` | Blocks checkout when a product's contraindication tag conflicts with a flag on the signed-in customer; names the conflicting combination. Guests and unflagged customers pass through | 9 |
| [`b2b-tiered-pricing`](b2b-tiered-pricing/) | `cart.transform.run` | For B2B company buyers: company tier discount (5–20%), optional higher location tier, plus a volume adder by subtotal; total capped at 40%. Non-B2B carts untouched | 12 |
| [`delivery-customization`](delivery-customization/) | `cart.delivery-options.transform.run` | Hides express/same-day options for carts containing items flagged as FDA Class II devices; adds "Signature required" to options when any line requires signature delivery | 9 |
| [`discount-stacking`](discount-stacking/) | `cart.checkout.validation.run` | Allows defined pairs of subscription, first-time and clinic discounts; blocks all three together, blocks generic codes stacked with others, and blocks any effective discount above 40% | 17 |

Verified 2026-09-24: **47/47 unit tests passed** (`cargo test --workspace`, native target), and all four crates built for `wasm32-wasip1` in release mode with binary sizes of 159–181 KiB (162,782–185,377 bytes), under Shopify's 256 kB limit.

## Build

```bash
cd packages/app
cargo test --workspace
cargo build --release --target wasm32-wasip1 -p <crate-name>
```

Release profile optimises for size (`opt-level = "z"`, LTO, stripped, `panic = "abort"`).

## Shopify limits that apply

Verified against [Shopify Functions documentation](https://shopify.dev/docs/api/functions/latest) on 2026-09-24: compiled binary ≤ 256 kB; 11 million instructions per run (for carts up to 200 lines); 128 kB input and 20 kB output; input query ≤ 3,000 bytes and cost ≤ 30. Custom apps containing Functions are available only to Shopify Plus stores.

## Before release

- Revalidate `input.graphql` and outputs against the current Function API version (manifests pin `2026-01`)
- Deploy with `shopify app deploy` to a development store and exercise each Function in a real checkout
- `cart-contraindication` relies on customer health-related metafields — requires the privacy review in [PRIVACY.md](../../../docs/PRIVACY.md) before use with real customers
