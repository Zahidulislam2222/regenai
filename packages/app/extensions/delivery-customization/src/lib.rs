//! Shopify Function — delivery customization.
//!
//! Target: `cart.delivery-options.transform.run`
//!
//! Two behaviours:
//!   1. Hide express delivery options when any cart line is an FDA
//!      Class II device. Rationale: Class II devices require carrier
//!      tracking + adult signature; same-day / next-day couriers don't
//!      reliably meet that chain-of-custody. Matches options whose
//!      handle / code / title contains "express", "same-day",
//!      "overnight", or "next-day" (case-insensitive).
//!   2. Rename delivery options with a "Signature required"
//!      suffix on carts that contain any line requiring signature
//!      delivery — read from the product metafield
//!      `regenai.ships_with_signature = "true"`, OR any product
//!      carrying a `pacemaker` / `epilepsy-history` contraindication
//!      tag (hazard-shipped items).
//!
//! Guest / plain-product carts pass through untouched.

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
#[derive(Debug, Deserialize)]
struct Input {
    cart: Cart,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Cart {
    delivery_groups: Vec<DeliveryGroup>,
    lines: Vec<CartLine>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeliveryGroup {
    id: String,
    delivery_options: Vec<DeliveryOption>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeliveryOption {
    handle: String,
    title: Option<String>,
    code: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CartLine {
    merchandise: Merchandise,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "__typename")]
enum Merchandise {
    ProductVariant { product: Product },
    #[serde(other)]
    Other,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Product {
    fda_class: Option<Metafield>,
    ships_with_signature: Option<Metafield>,
    contraindications: Option<Metafield>,
}

#[derive(Debug, Deserialize)]
struct Metafield {
    value: String,
}

// ---------------------------------------------------------------------------
// Output — delivery-options.transform operations. Hide + Rename + Move.
// ---------------------------------------------------------------------------
#[derive(Debug, Default, Serialize)]
struct Output {
    operations: Vec<Operation>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "__typename")]
enum Operation {
    #[serde(rename_all = "camelCase")]
    Hide(HideOperation),
    #[serde(rename_all = "camelCase")]
    Rename(RenameOperation),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct HideOperation {
    delivery_option_handle: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RenameOperation {
    delivery_option_handle: String,
    title: String,
}

// ---------------------------------------------------------------------------
// Pure rules core.
// ---------------------------------------------------------------------------

const EXPRESS_NEEDLES: [&str; 5] = ["express", "same-day", "same day", "overnight", "next-day"];

fn is_express(opt: &DeliveryOption) -> bool {
    let pool = format!(
        "{} {} {}",
        opt.handle.to_lowercase(),
        opt.title.as_deref().unwrap_or("").to_lowercase(),
        opt.code.as_deref().unwrap_or("").to_lowercase(),
    );
    EXPRESS_NEEDLES.iter().any(|needle| pool.contains(needle))
}

fn cart_has_class_ii(cart: &Cart) -> bool {
    cart.lines.iter().any(|line| match &line.merchandise {
        Merchandise::ProductVariant { product } => product
            .fda_class
            .as_ref()
            .map(|m| m.value.trim() == "Class II")
            .unwrap_or(false),
        _ => false,
    })
}

fn cart_needs_signature(cart: &Cart) -> bool {
    cart.lines.iter().any(|line| match &line.merchandise {
        Merchandise::ProductVariant { product } => {
            let explicit = product
                .ships_with_signature
                .as_ref()
                .map(|m| m.value.eq_ignore_ascii_case("true"))
                .unwrap_or(false);
            if explicit {
                return true;
            }
            // Implicit: hazard-tagged products always ship with signature.
            product
                .contraindications
                .as_ref()
                .map(|m| {
                    let v = &m.value;
                    v.contains("pacemaker") || v.contains("epilepsy-history")
                })
                .unwrap_or(false)
        }
        _ => false,
    })
}

fn run_rules(input: &Input) -> Output {
    let class_ii = cart_has_class_ii(&input.cart);
    let needs_sig = cart_needs_signature(&input.cart);

    if !class_ii && !needs_sig {
        return Output::default();
    }

    let mut ops = Vec::new();
    for group in &input.cart.delivery_groups {
        let _ = group.id; // per-option ops are keyed on the option handle
        for opt in &group.delivery_options {
            // Rule 1 — hide express options when Class II is present.
            if class_ii && is_express(opt) {
                ops.push(Operation::Hide(HideOperation {
                    delivery_option_handle: opt.handle.clone(),
                }));
                continue;
            }

            // Rule 2 — rename surviving options to flag signature-required.
            if needs_sig {
                let current = opt.title.clone().unwrap_or_default();
                // Avoid double-suffixing if we somehow re-run on our own output.
                if !current.contains("Signature required") {
                    let new_title = if current.is_empty() {
                        "Signature required".to_string()
                    } else {
                        format!("{current} — Signature required")
                    };
                    ops.push(Operation::Rename(RenameOperation {
                        delivery_option_handle: opt.handle.clone(),
                        title: new_title,
                    }));
                }
            }
        }
    }

    Output { operations: ops }
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

    fn opt(handle: &str, title: Option<&str>, code: Option<&str>) -> DeliveryOption {
        DeliveryOption {
            handle: handle.to_string(),
            title: title.map(String::from),
            code: code.map(String::from),
        }
    }

    #[test]
    fn is_express_matches_handle_title_code_case_insensitive() {
        assert!(is_express(&opt("express-2day", None, None)));
        assert!(is_express(&opt("uk-royalmail", Some("Next-Day"), None)));
        assert!(is_express(&opt("carrier-x", None, Some("OVERNIGHT"))));
        assert!(is_express(&opt("same-day-courier", None, None)));
        assert!(is_express(&opt("fedex", Some("Same Day"), None)));
        assert!(!is_express(&opt("standard-ground", Some("Standard"), None)));
    }

    fn line_class_ii() -> CartLine {
        CartLine {
            merchandise: Merchandise::ProductVariant {
                product: Product {
                    fda_class: Some(Metafield {
                        value: "Class II".to_string(),
                    }),
                    ships_with_signature: None,
                    contraindications: None,
                },
            },
        }
    }

    fn line_needs_signature_via_flag() -> CartLine {
        CartLine {
            merchandise: Merchandise::ProductVariant {
                product: Product {
                    fda_class: None,
                    ships_with_signature: Some(Metafield {
                        value: "true".to_string(),
                    }),
                    contraindications: None,
                },
            },
        }
    }

    fn line_needs_signature_via_pacemaker_tag() -> CartLine {
        CartLine {
            merchandise: Merchandise::ProductVariant {
                product: Product {
                    fda_class: None,
                    ships_with_signature: None,
                    contraindications: Some(Metafield {
                        value: "pacemaker".to_string(),
                    }),
                },
            },
        }
    }

    fn line_plain() -> CartLine {
        CartLine {
            merchandise: Merchandise::ProductVariant {
                product: Product {
                    fda_class: None,
                    ships_with_signature: None,
                    contraindications: None,
                },
            },
        }
    }

    fn mk_input(lines: Vec<CartLine>, options: Vec<DeliveryOption>) -> Input {
        Input {
            cart: Cart {
                lines,
                delivery_groups: vec![DeliveryGroup {
                    id: "gid://shopify/DeliveryGroup/1".to_string(),
                    delivery_options: options,
                }],
            },
        }
    }

    #[test]
    fn plain_cart_emits_no_ops() {
        let out = run_rules(&mk_input(
            vec![line_plain()],
            vec![opt("standard", Some("Standard"), None), opt("express", Some("Express"), None)],
        ));
        assert!(out.operations.is_empty());
    }

    #[test]
    fn class_ii_hides_express_only() {
        let out = run_rules(&mk_input(
            vec![line_class_ii()],
            vec![
                opt("standard", Some("Standard"), None),
                opt("express-2day", Some("Express 2-day"), None),
                opt("overnight", Some("Overnight"), None),
            ],
        ));
        // 2 hides + 0 renames (no signature needed for Class II alone)
        let hides: Vec<_> = out
            .operations
            .iter()
            .filter(|o| matches!(o, Operation::Hide(_)))
            .collect();
        let renames: Vec<_> = out
            .operations
            .iter()
            .filter(|o| matches!(o, Operation::Rename(_)))
            .collect();
        assert_eq!(hides.len(), 2);
        assert_eq!(renames.len(), 0);
    }

    #[test]
    fn ships_with_signature_renames_all_surviving_options() {
        let out = run_rules(&mk_input(
            vec![line_needs_signature_via_flag()],
            vec![
                opt("standard", Some("Standard"), None),
                opt("priority", Some("Priority"), None),
            ],
        ));
        // 0 hides (not Class II), 2 renames
        assert!(out
            .operations
            .iter()
            .all(|o| matches!(o, Operation::Rename(_))));
        assert_eq!(out.operations.len(), 2);
    }

    #[test]
    fn pacemaker_contraindication_implies_signature() {
        let out = run_rules(&mk_input(
            vec![line_needs_signature_via_pacemaker_tag()],
            vec![opt("standard", Some("Standard"), None)],
        ));
        assert_eq!(out.operations.len(), 1);
        if let Operation::Rename(op) = &out.operations[0] {
            assert!(op.title.contains("Signature required"));
        } else {
            panic!("expected rename");
        }
    }

    #[test]
    fn class_ii_plus_signature_hides_express_and_renames_rest() {
        // Single product is both Class II and requires signature.
        let line = CartLine {
            merchandise: Merchandise::ProductVariant {
                product: Product {
                    fda_class: Some(Metafield {
                        value: "Class II".to_string(),
                    }),
                    ships_with_signature: Some(Metafield {
                        value: "true".to_string(),
                    }),
                    contraindications: None,
                },
            },
        };
        let out = run_rules(&mk_input(
            vec![line],
            vec![
                opt("standard", Some("Standard"), None),
                opt("overnight-express", Some("Overnight Express"), None),
                opt("priority", Some("Priority"), None),
            ],
        ));
        let hides = out
            .operations
            .iter()
            .filter(|o| matches!(o, Operation::Hide(_)))
            .count();
        let renames = out
            .operations
            .iter()
            .filter(|o| matches!(o, Operation::Rename(_)))
            .count();
        assert_eq!(hides, 1); // overnight-express
        assert_eq!(renames, 2); // standard + priority get renamed
    }

    #[test]
    fn rename_does_not_double_suffix() {
        let out = run_rules(&mk_input(
            vec![line_needs_signature_via_flag()],
            vec![opt(
                "standard",
                Some("Ground — Signature required"),
                None,
            )],
        ));
        assert!(out.operations.is_empty());
    }

    #[test]
    fn empty_title_still_renames() {
        let out = run_rules(&mk_input(
            vec![line_needs_signature_via_flag()],
            vec![opt("bare", None, None)],
        ));
        assert_eq!(out.operations.len(), 1);
        if let Operation::Rename(op) = &out.operations[0] {
            assert_eq!(op.title, "Signature required");
        } else {
            panic!("expected rename");
        }
    }

    #[test]
    fn class_i_alone_passes() {
        let line = CartLine {
            merchandise: Merchandise::ProductVariant {
                product: Product {
                    fda_class: Some(Metafield {
                        value: "Class I".to_string(),
                    }),
                    ships_with_signature: None,
                    contraindications: None,
                },
            },
        };
        let out = run_rules(&mk_input(
            vec![line],
            vec![opt("express", Some("Express"), None)],
        ));
        assert!(out.operations.is_empty());
    }
}
