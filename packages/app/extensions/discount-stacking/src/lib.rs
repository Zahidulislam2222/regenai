//! Shopify Function — discount stacking validator.
//!
//! Target: `cart.checkout.validation.run`
//!
//! PROJECT_PLAN §6 Phase-1 features:
//!   "Allows subscription + first-time + clinic discount stack under rules.
//!    Caps total discount at 40%."
//!
//! Validates combinations of:
//!   - Subscription selling-plan discount (implicit — any line with a
//!     `sellingPlanAllocation` counts as subscription-attached).
//!   - First-time customer discount codes (codes with prefix `WELCOME`
//!     or `FIRST-` recognised by convention).
//!   - Clinic / B2B discount codes (prefix `CLINIC-`).
//!   - Any other applied discount codes (treated as "generic", one allowed).
//!
//! Stacking rules:
//!   - Subscription + first-time: OK
//!   - Subscription + clinic: OK
//!   - First-time + clinic: OK
//!   - All three: **blocked** (too much stacking, abuse risk)
//!   - Generic code is treated as exclusive — cannot stack with any other.
//!   - Effective total discount (subtotal − total) / subtotal must not
//!     exceed 40%. If it does, the checkout is blocked with a clear error.
//!
//! Output is the standard `cart.checkout.validation.run` shape:
//!   `{ errors: [{ localizedMessage, target }] }`.

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
    discount_codes: Vec<DiscountCode>,
    #[serde(default)]
    lines: Vec<CartLine>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Cost {
    subtotal_amount: Money,
    total_amount: Money,
}

#[derive(Debug, Deserialize)]
struct Money {
    amount: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DiscountCode {
    code: String,
    applicable: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CartLine {
    selling_plan_allocation: Option<SellingPlanAllocation>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SellingPlanAllocation {
    #[serde(rename = "sellingPlan")]
    selling_plan: Option<SellingPlan>,
}

#[derive(Debug, Deserialize)]
struct SellingPlan {
    #[allow(dead_code)]
    id: String,
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
#[derive(Debug, Default, Serialize)]
struct Output {
    errors: Vec<ValidationError>,
}

#[derive(Debug, Serialize)]
struct ValidationError {
    #[serde(rename = "localizedMessage")]
    localized_message: String,
    target: String,
}

// ---------------------------------------------------------------------------
// Pure rules core
// ---------------------------------------------------------------------------

const CAP_TOTAL_PCT: u32 = 40;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CodeKind {
    FirstTime,
    Clinic,
    Generic,
}

fn classify_code(code: &str) -> CodeKind {
    let up = code.to_uppercase();
    if up.starts_with("WELCOME") || up.starts_with("FIRST-") || up.starts_with("FIRSTTIME") {
        CodeKind::FirstTime
    } else if up.starts_with("CLINIC-") || up.starts_with("CLINIC_") || up == "CLINIC" {
        CodeKind::Clinic
    } else {
        CodeKind::Generic
    }
}

fn has_subscription(lines: &[CartLine]) -> bool {
    lines.iter().any(|l| {
        l.selling_plan_allocation
            .as_ref()
            .and_then(|a| a.selling_plan.as_ref())
            .is_some()
    })
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

fn effective_discount_pct(subtotal_cents: u64, total_cents: u64) -> u32 {
    if subtotal_cents == 0 || total_cents >= subtotal_cents {
        return 0;
    }
    let saved = subtotal_cents - total_cents;
    let pct = (saved * 100) / subtotal_cents;
    pct as u32
}

fn validate_stacking(kinds: &[CodeKind], has_sub: bool) -> Option<&'static str> {
    let first = kinds.iter().filter(|k| **k == CodeKind::FirstTime).count();
    let clinic = kinds.iter().filter(|k| **k == CodeKind::Clinic).count();
    let generic = kinds.iter().filter(|k| **k == CodeKind::Generic).count();

    // Generic codes are exclusive — can't stack with any other code OR sub.
    if generic > 0 && (first > 0 || clinic > 0 || has_sub) {
        return Some(
            "A manual-discount code cannot be combined with subscription, first-time, or clinic discounts. Remove one to continue.",
        );
    }

    // More than one first-time code → abuse
    if first > 1 {
        return Some(
            "Only one first-time-customer discount can be applied per order.",
        );
    }

    // More than one clinic code → abuse
    if clinic > 1 {
        return Some(
            "Only one clinic discount can be applied per order.",
        );
    }

    // Subscription + first-time + clinic all three → blocked
    if has_sub && first == 1 && clinic == 1 {
        return Some(
            "Subscription, first-time, and clinic discounts cannot all stack in one order.",
        );
    }

    None
}

fn run_rules(input: &Input) -> Output {
    let applied_kinds: Vec<CodeKind> = input
        .cart
        .discount_codes
        .iter()
        .filter(|d| d.applicable)
        .map(|d| classify_code(&d.code))
        .collect();

    let has_sub = has_subscription(&input.cart.lines);

    let mut errors = Vec::new();

    if let Some(msg) = validate_stacking(&applied_kinds, has_sub) {
        errors.push(ValidationError {
            localized_message: msg.to_string(),
            target: "cart".to_string(),
        });
    }

    // Cap check
    let subtotal = money_to_cents(&input.cart.cost.subtotal_amount.amount).unwrap_or(0);
    let total = money_to_cents(&input.cart.cost.total_amount.amount).unwrap_or(0);
    let pct = effective_discount_pct(subtotal, total);
    if pct > CAP_TOTAL_PCT {
        errors.push(ValidationError {
            localized_message: format!(
                "Total discount ({pct}%) exceeds the {CAP_TOTAL_PCT}% stacking cap. Remove a discount or contact support."
            ),
            target: "cart".to_string(),
        });
    }

    Output { errors }
}

// ---------------------------------------------------------------------------
// WASM entry.
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
    fn classify_code_prefixes() {
        assert_eq!(classify_code("WELCOME10"), CodeKind::FirstTime);
        assert_eq!(classify_code("welcome10"), CodeKind::FirstTime);
        assert_eq!(classify_code("FIRST-TIME-BUYER"), CodeKind::FirstTime);
        assert_eq!(classify_code("FIRSTTIME"), CodeKind::FirstTime);
        assert_eq!(classify_code("CLINIC-ACME"), CodeKind::Clinic);
        assert_eq!(classify_code("clinic-acme"), CodeKind::Clinic);
        assert_eq!(classify_code("CLINIC"), CodeKind::Clinic);
        assert_eq!(classify_code("SUMMER25"), CodeKind::Generic);
        assert_eq!(classify_code("BFCM"), CodeKind::Generic);
    }

    #[test]
    fn no_codes_no_sub_passes() {
        assert_eq!(validate_stacking(&[], false), None);
    }

    #[test]
    fn sub_plus_first_time_passes() {
        assert_eq!(validate_stacking(&[CodeKind::FirstTime], true), None);
    }

    #[test]
    fn sub_plus_clinic_passes() {
        assert_eq!(validate_stacking(&[CodeKind::Clinic], true), None);
    }

    #[test]
    fn first_time_plus_clinic_passes() {
        assert_eq!(
            validate_stacking(&[CodeKind::FirstTime, CodeKind::Clinic], false),
            None
        );
    }

    #[test]
    fn all_three_blocks() {
        assert!(validate_stacking(&[CodeKind::FirstTime, CodeKind::Clinic], true).is_some());
    }

    #[test]
    fn two_first_time_blocks() {
        assert!(validate_stacking(&[CodeKind::FirstTime, CodeKind::FirstTime], false).is_some());
    }

    #[test]
    fn two_clinic_blocks() {
        assert!(validate_stacking(&[CodeKind::Clinic, CodeKind::Clinic], false).is_some());
    }

    #[test]
    fn generic_with_first_time_blocks() {
        assert!(validate_stacking(&[CodeKind::Generic, CodeKind::FirstTime], false).is_some());
    }

    #[test]
    fn generic_with_subscription_blocks() {
        assert!(validate_stacking(&[CodeKind::Generic], true).is_some());
    }

    #[test]
    fn generic_alone_no_sub_passes() {
        assert_eq!(validate_stacking(&[CodeKind::Generic], false), None);
    }

    #[test]
    fn effective_pct_math() {
        assert_eq!(effective_discount_pct(10_000, 10_000), 0); // no discount
        assert_eq!(effective_discount_pct(10_000, 9_000), 10);
        assert_eq!(effective_discount_pct(10_000, 6_000), 40); // exactly at cap
        assert_eq!(effective_discount_pct(10_000, 5_999), 40); // 40.01 rounds down
        assert_eq!(effective_discount_pct(10_000, 5_000), 50); // over cap
        assert_eq!(effective_discount_pct(0, 0), 0);
        assert_eq!(effective_discount_pct(100, 200), 0); // weird state, safe default
    }

    fn mk_input(
        codes: &[&str],
        subscription: bool,
        subtotal: &str,
        total: &str,
    ) -> Input {
        Input {
            cart: Cart {
                cost: Cost {
                    subtotal_amount: Money {
                        amount: subtotal.to_string(),
                    },
                    total_amount: Money {
                        amount: total.to_string(),
                    },
                },
                discount_codes: codes
                    .iter()
                    .map(|c| DiscountCode {
                        code: c.to_string(),
                        applicable: true,
                    })
                    .collect(),
                lines: if subscription {
                    vec![CartLine {
                        selling_plan_allocation: Some(SellingPlanAllocation {
                            selling_plan: Some(SellingPlan {
                                id: "gid://shopify/SellingPlan/1".to_string(),
                            }),
                        }),
                    }]
                } else {
                    vec![CartLine {
                        selling_plan_allocation: None,
                    }]
                },
            },
        }
    }

    #[test]
    fn clean_cart_passes() {
        let out = run_rules(&mk_input(&[], false, "100.00", "100.00"));
        assert!(out.errors.is_empty());
    }

    #[test]
    fn subscription_alone_passes() {
        let out = run_rules(&mk_input(&[], true, "100.00", "90.00"));
        assert!(out.errors.is_empty());
    }

    #[test]
    fn cap_exceeded_blocks() {
        // $100 subtotal → $55 total → 45% discount → over 40% cap
        let out = run_rules(&mk_input(&[], true, "100.00", "55.00"));
        assert_eq!(out.errors.len(), 1);
        assert!(out.errors[0].localized_message.contains("cap"));
    }

    #[test]
    fn inapplicable_code_is_ignored() {
        // Simulate a WELCOME code that shopify marked inapplicable.
        let input = Input {
            cart: Cart {
                cost: Cost {
                    subtotal_amount: Money {
                        amount: "100.00".to_string(),
                    },
                    total_amount: Money {
                        amount: "100.00".to_string(),
                    },
                },
                discount_codes: vec![DiscountCode {
                    code: "WELCOME10".to_string(),
                    applicable: false,
                }],
                lines: vec![],
            },
        };
        let out = run_rules(&input);
        assert!(out.errors.is_empty());
    }

    #[test]
    fn all_three_stack_blocks_with_message() {
        let out = run_rules(&mk_input(
            &["WELCOME10", "CLINIC-ACME"],
            true,
            "100.00",
            "80.00",
        ));
        // Stacking error (under 40% cap so only one error)
        assert_eq!(out.errors.len(), 1);
        assert!(out
            .errors[0]
            .localized_message
            .to_lowercase()
            .contains("subscription"));
    }
}
