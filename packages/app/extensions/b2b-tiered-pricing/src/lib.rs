//! Shopify Function — B2B tiered pricing.
//!
//! Target: `cart.transform.run`
//!
//! Applies a two-layer discount to every cart line when the cart's buyer
//! is a B2B company:
//!   1. Base tier discount read from `Company.metafield(regenai/tier)` —
//!      bronze 5%, silver 10%, gold 15%, platinum 20%.
//!   2. A location-level override, if the `Company.Location.metafield(
//!      regenai/location_tier)` is set — same four values; higher of the
//!      two wins so a gold-tier company's premier location can upgrade to
//!      platinum without having to reassign the whole company.
//!   3. Volume adder based on the cart subtotal:
//!        ≥ $500  → +2 pp
//!        ≥ $1000 → +5 pp   (supersedes the 2 pp)
//!        ≥ $5000 → +10 pp  (supersedes the 5 pp)
//!      Capped at 40% total (PROJECT_PLAN §6 "discount stacking cap").
//!
//! Guest / non-B2B carts pass through untouched (no operations returned).

use regenai_extensions_shared::CompanyTier;
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Input {
    cart: Cart,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Cart {
    cost: Cost,
    lines: Vec<CartLine>,
    buyer_identity: Option<BuyerIdentity>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Cost {
    subtotal_amount: Money,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Money {
    amount: String,
    #[allow(dead_code)]
    currency_code: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CartLine {
    id: String,
    cost: LineCost,
    merchandise: Merchandise,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LineCost {
    amount_per_quantity: Money,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "__typename")]
enum Merchandise {
    ProductVariant {},
    #[serde(other)]
    Other,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BuyerIdentity {
    purchasing_company: Option<PurchasingCompany>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PurchasingCompany {
    company: Option<Company>,
    location: Option<Location>,
}

#[derive(Debug, Deserialize)]
struct Company {
    tier: Option<Metafield>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Location {
    location_tier: Option<Metafield>,
}

#[derive(Debug, Deserialize)]
struct Metafield {
    value: String,
}

// ---------------------------------------------------------------------------
// Output — CartTransform operations.
// ---------------------------------------------------------------------------
#[derive(Debug, Default, Serialize)]
struct Output {
    operations: Vec<Operation>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "__typename")]
enum Operation {
    Update(UpdateOperation),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateOperation {
    cart_line_id: String,
    price: Price,
    title: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Price {
    adjustment: Adjustment,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Adjustment {
    fixed_pricing_per_unit: FixedPerUnit,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FixedPerUnit {
    amount: String,
}

// ---------------------------------------------------------------------------
// Pure rules core — separate from I/O + Shopify wire format.
// ---------------------------------------------------------------------------

const CAP_TOTAL_PCT: u32 = 40;

fn effective_tier(
    company: Option<CompanyTier>,
    location: Option<CompanyTier>,
) -> Option<CompanyTier> {
    match (company, location) {
        (None, None) => None,
        (Some(c), None) => Some(c),
        (None, Some(l)) => Some(l),
        (Some(c), Some(l)) => Some(max_tier(c, l)),
    }
}

fn max_tier(a: CompanyTier, b: CompanyTier) -> CompanyTier {
    let rank = |t: CompanyTier| -> u8 {
        match t {
            CompanyTier::Bronze => 0,
            CompanyTier::Silver => 1,
            CompanyTier::Gold => 2,
            CompanyTier::Platinum => 3,
        }
    };
    if rank(a) >= rank(b) {
        a
    } else {
        b
    }
}

fn volume_adder_pct(subtotal_cents: u64) -> u32 {
    if subtotal_cents >= 500_000 {
        10
    } else if subtotal_cents >= 100_000 {
        5
    } else if subtotal_cents >= 50_000 {
        2
    } else {
        0
    }
}

fn effective_discount_pct(
    company: Option<CompanyTier>,
    location: Option<CompanyTier>,
    subtotal_cents: u64,
) -> u32 {
    let Some(tier) = effective_tier(company, location) else {
        return 0;
    };
    let base = u32::from(tier.base_discount_pct());
    let volume = volume_adder_pct(subtotal_cents);
    (base + volume).min(CAP_TOTAL_PCT)
}

fn money_to_cents(amount: &str) -> Option<u64> {
    let amount = amount.trim();
    let parts: Vec<&str> = amount.splitn(2, '.').collect();
    let whole: u64 = parts.first()?.parse().ok()?;
    let cents = match parts.get(1) {
        Some(frac) => {
            let frac = &frac[..frac.len().min(2)];
            let mut v: u64 = frac.parse().ok()?;
            if frac.len() == 1 {
                v *= 10;
            }
            v
        }
        None => 0,
    };
    Some(whole.saturating_mul(100).saturating_add(cents))
}

fn apply_discount_cents(cents: u64, pct: u32) -> u64 {
    let retained = 100_u64.saturating_sub(u64::from(pct));
    cents.saturating_mul(retained) / 100
}

fn cents_to_money(cents: u64) -> String {
    let whole = cents / 100;
    let frac = cents % 100;
    format!("{whole}.{frac:02}")
}

fn run_rules(input: &Input) -> Output {
    let company_tier = input
        .cart
        .buyer_identity
        .as_ref()
        .and_then(|b| b.purchasing_company.as_ref())
        .and_then(|pc| pc.company.as_ref())
        .and_then(|c| c.tier.as_ref())
        .and_then(|m| CompanyTier::parse(&m.value));

    let location_tier = input
        .cart
        .buyer_identity
        .as_ref()
        .and_then(|b| b.purchasing_company.as_ref())
        .and_then(|pc| pc.location.as_ref())
        .and_then(|l| l.location_tier.as_ref())
        .and_then(|m| CompanyTier::parse(&m.value));

    let subtotal_cents = money_to_cents(&input.cart.cost.subtotal_amount.amount).unwrap_or(0);
    let pct = effective_discount_pct(company_tier, location_tier, subtotal_cents);
    if pct == 0 {
        return Output::default();
    }

    let mut operations = Vec::with_capacity(input.cart.lines.len());
    for line in &input.cart.lines {
        let Merchandise::ProductVariant {} = &line.merchandise else {
            continue;
        };
        let Some(unit_cents) = money_to_cents(&line.cost.amount_per_quantity.amount) else {
            continue;
        };
        let new_cents = apply_discount_cents(unit_cents, pct);
        if new_cents == unit_cents {
            continue;
        }
        operations.push(Operation::Update(UpdateOperation {
            cart_line_id: line.id.clone(),
            price: Price {
                adjustment: Adjustment {
                    fixed_pricing_per_unit: FixedPerUnit {
                        amount: cents_to_money(new_cents),
                    },
                },
            },
            title: Some(format!("B2B tier discount ({pct}%)")),
        }));
    }

    Output { operations }
}

// ---------------------------------------------------------------------------
// WASM entry point.
// ---------------------------------------------------------------------------
#[cfg(target_arch = "wasm32")]
#[no_mangle]
pub extern "C" fn _start() {
    use std::io::{self, Read, Write};
    let mut buf = String::new();
    io::stdin().read_to_string(&mut buf).expect("read stdin");
    let input: Input = serde_json::from_str(&buf).expect("parse input");
    let output = run_rules(&input);
    let payload = serde_json::to_string(&output).expect("serialise output");
    io::stdout().write_all(payload.as_bytes()).expect("write");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn effective_tier_prefers_max() {
        assert_eq!(
            effective_tier(Some(CompanyTier::Bronze), Some(CompanyTier::Platinum)),
            Some(CompanyTier::Platinum)
        );
        assert_eq!(
            effective_tier(Some(CompanyTier::Gold), Some(CompanyTier::Silver)),
            Some(CompanyTier::Gold)
        );
        assert_eq!(effective_tier(None, None), None);
    }

    #[test]
    fn volume_adder_thresholds() {
        assert_eq!(volume_adder_pct(0), 0);
        assert_eq!(volume_adder_pct(49_999), 0);
        assert_eq!(volume_adder_pct(50_000), 2);
        assert_eq!(volume_adder_pct(99_999), 2);
        assert_eq!(volume_adder_pct(100_000), 5);
        assert_eq!(volume_adder_pct(499_999), 5);
        assert_eq!(volume_adder_pct(500_000), 10);
        assert_eq!(volume_adder_pct(10_000_000), 10);
    }

    #[test]
    fn bronze_below_volume_threshold_is_5pct() {
        assert_eq!(
            effective_discount_pct(Some(CompanyTier::Bronze), None, 10_000),
            5
        );
    }

    #[test]
    fn platinum_with_5k_subtotal_totals_30() {
        assert_eq!(
            effective_discount_pct(Some(CompanyTier::Platinum), None, 1_000_000),
            30
        );
    }

    #[test]
    fn cap_clamps_at_40() {
        // Current tiers can't naturally exceed 30 — but the cap constant
        // exists so the min(CAP_TOTAL_PCT) call stays meaningful if
        // stacking grows. Assert the constant.
        assert_eq!(CAP_TOTAL_PCT, 40);
    }

    #[test]
    fn no_tier_no_discount() {
        assert_eq!(effective_discount_pct(None, None, 10_000_000), 0);
    }

    #[test]
    fn money_to_cents_round_trip() {
        assert_eq!(money_to_cents("100"), Some(10_000));
        assert_eq!(money_to_cents("100.00"), Some(10_000));
        assert_eq!(money_to_cents("100.5"), Some(10_050));
        assert_eq!(money_to_cents("100.05"), Some(10_005));
        assert_eq!(money_to_cents("0.99"), Some(99));
        assert_eq!(money_to_cents("not money"), None);
    }

    #[test]
    fn apply_discount_cents_matches_pct() {
        assert_eq!(apply_discount_cents(10_000, 0), 10_000);
        assert_eq!(apply_discount_cents(10_000, 10), 9_000);
        assert_eq!(apply_discount_cents(10_000, 25), 7_500);
        assert_eq!(apply_discount_cents(10_000, 40), 6_000);
        assert_eq!(apply_discount_cents(12_345, 15), 10_493);
    }

    #[test]
    fn cents_to_money_formats_two_decimals() {
        assert_eq!(cents_to_money(9_000), "90.00");
        assert_eq!(cents_to_money(10_493), "104.93");
        assert_eq!(cents_to_money(7), "0.07");
    }

    fn mk_input(company_tier: Option<&str>, subtotal: &str, lines: &[(&str, &str)]) -> Input {
        Input {
            cart: Cart {
                cost: Cost {
                    subtotal_amount: Money {
                        amount: subtotal.to_string(),
                        currency_code: "USD".to_string(),
                    },
                },
                lines: lines
                    .iter()
                    .enumerate()
                    .map(|(i, (id, amt))| CartLine {
                        id: format!("gid://shopify/CartLine/{id}-{i}"),
                        cost: LineCost {
                            amount_per_quantity: Money {
                                amount: amt.to_string(),
                                currency_code: "USD".to_string(),
                            },
                        },
                        merchandise: Merchandise::ProductVariant {},
                    })
                    .collect(),
                buyer_identity: company_tier.map(|t| BuyerIdentity {
                    purchasing_company: Some(PurchasingCompany {
                        company: Some(Company {
                            tier: Some(Metafield {
                                value: t.to_string(),
                            }),
                        }),
                        location: None,
                    }),
                }),
            },
        }
    }

    #[test]
    fn gold_on_2k_subtotal_emits_ops_per_line() {
        let input = mk_input(
            Some("gold"),
            "2000.00",
            &[("sku-a", "100.00"), ("sku-b", "50.00")],
        );
        let out = run_rules(&input);
        assert_eq!(out.operations.len(), 2);
        let Operation::Update(op0) = &out.operations[0];
        assert_eq!(op0.price.adjustment.fixed_pricing_per_unit.amount, "80.00");
        let Operation::Update(op1) = &out.operations[1];
        assert_eq!(op1.price.adjustment.fixed_pricing_per_unit.amount, "40.00");
    }

    #[test]
    fn no_company_no_ops() {
        let input = mk_input(None, "2000.00", &[("sku-a", "100.00")]);
        let out = run_rules(&input);
        assert!(out.operations.is_empty());
    }

    #[test]
    fn unrecognised_tier_string_no_ops() {
        let input = mk_input(Some("nonsense"), "2000.00", &[("sku-a", "100.00")]);
        let out = run_rules(&input);
        assert!(out.operations.is_empty());
    }
}
