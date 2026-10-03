# Shopify Functions

Three deployable Rust Functions are compiled to WebAssembly for Shopify's cart and checkout runtime. Shared helpers live in [`../extensions-shared`](../extensions-shared). The discount stacking prototype is retained in [`../experimental/discount-stacking`](../experimental/discount-stacking/README.md) because the current validation schema does not expose applied codes.

| Function | Target | Behaviour | Unit tests |
|---|---|---|---:|
| [`cart-contraindication`](cart-contraindication/) | `cart.validations.generate.run` | Adds a cart validation when a product's contraindication tag conflicts with a signed-in customer's health flag; guests and unflagged customers pass | 9 |
| [`b2b-tiered-pricing`](b2b-tiered-pricing/) | `cart.transform.run` | Generates line updates for company-tier and volume pricing; Shopify restricts line updates to Plus stores | 12 |
| [`delivery-customization`](delivery-customization/) | `cart.delivery-options.transform.run` | Hides express/same-day options for carts containing items flagged as FDA Class II devices; adds "Signature required" to options when any line requires signature delivery | 9 |

Verified 2026-10-03: workspace Rust tests passed, including the experimental rule crate. Three deployable Functions passed 2026-01 schema type generation, `wasm32-unknown-unknown` release builds (39–68 KiB), and Shopify CLI local runtime tests with empty and positive synthetic inputs. Shopify accepted them in inactive draft app version `regenai-merchant-sandbox-4`; no version release, install or store-level activation has occurred.

## Build

```bash
cd packages/app
cargo test --workspace
cargo build --release --target wasm32-unknown-unknown -p <crate-name>
```

Release profile optimises for size (`opt-level = "z"`, LTO, stripped, `panic = "abort"`).

## Shopify limits that apply

Shopify's [Rust Function guide](https://shopify.dev/docs/apps/build/functions/programming-languages/rust-for-functions) requires `wasm32-unknown-unknown` and names a 256 kB module limit. [Cart Transform](https://shopify.dev/docs/api/functions/2026-01/cart-transform) restricts `lineUpdate` operations to Plus stores. Custom apps containing Functions are available on Plus live stores; a public App Store distribution is the documented all-plan path.

## Before release

- Install and activate the draft only after app credentials and required scopes are reviewed; the current app config requests `read_products` only.
- Exercise applicable Functions in a real development-store Bogus Gateway checkout. Local runtime success does not prove store activation.
- `cart-contraindication` relies on customer health-related metafields — requires the privacy review in [PRIVACY.md](../../../docs/PRIVACY.md) before use with real customers
