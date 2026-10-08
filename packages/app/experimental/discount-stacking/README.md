# Discount stacking API research

The pure Rust rules and their tests are retained here. This crate is **not** in
the Shopify app extension directory or uploaded draft version.

Shopify's 2026-01 cart validation schema does not expose applied discount codes,
and the former `cart.checkout.validation.run` target is unavailable. The
existing input query and WASI entrypoint are historical implementations. The
combination and percentage rules cannot be represented as a working checkout
validator from that input. Public ordering remains closed. A future implementation needs a supported Shopify
Discount API architecture and a real development-store checkout test.
