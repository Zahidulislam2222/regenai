//! Shopify Function — cart-contraindication validator.
//!
//! Target: `cart.checkout.validation.run`
//!
//! Reads the customer's medical-flag metafield + each cart line's
//! contraindication metafield; if any product has a contraindication tag
//! that conflicts with any of the customer's flags, the checkout is
//! blocked with a human-readable error that names the specific combination.
//!
//! No-flag customers pass through untouched — the Function never blocks
//! guest checkout (the data can only be set once the customer is
//! authenticated + has answered the recovery quiz or medical-intake form).
//!
//! Output shape is the standard `cart.checkout.validation.run` Function
//! output: `{ errors: [{ localizedMessage, target }] }`. An empty `errors`
//! array means the checkout proceeds.

use regenai_extensions_shared::{ContraTag, MedicalFlag};
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Input shape — matches the `input.graphql` query response.
// Nullability follows Shopify's schema: metafields can be null if unset.
// ---------------------------------------------------------------------------
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Input {
    cart: Cart,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Cart {
    lines: Vec<CartLine>,
    buyer_identity: Option<BuyerIdentity>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CartLine {
    id: String,
    merchandise: Merchandise,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "__typename", rename_all = "camelCase")]
enum Merchandise {
    ProductVariant {
        product: Product,
    },
    #[serde(other)]
    Other,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Product {
    title: String,
    contraindications: Option<Metafield>,
    fda_class: Option<Metafield>,
}

#[derive(Debug, Deserialize)]
struct Metafield {
    value: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BuyerIdentity {
    customer: Option<Customer>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Customer {
    medical_flags: Option<Metafield>,
}

// ---------------------------------------------------------------------------
// Output shape — Shopify validation output.
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
// Pure rules core — no I/O, no Shopify types. Tested in #[cfg(test)].
// ---------------------------------------------------------------------------

fn parse_flags(raw: &str) -> Vec<MedicalFlag> {
    raw.split(',').filter_map(MedicalFlag::parse).collect()
}

fn parse_tags(raw: &str) -> Vec<ContraTag> {
    raw.split(',').filter_map(ContraTag::parse).collect()
}

/// Returns the list of conflict pairs (product contraindication, customer flag)
/// for a single line item. Empty vec → no conflict.
fn conflicts_for_line(
    product_contras: &str,
    customer_flags: &[MedicalFlag],
) -> Vec<(ContraTag, MedicalFlag)> {
    let tags = parse_tags(product_contras);
    let mut hits = Vec::new();
    for tag in tags {
        for &flag in customer_flags {
            if tag.conflicts_with(flag) {
                hits.push((tag, flag));
            }
        }
    }
    hits
}

fn flag_label(flag: MedicalFlag) -> &'static str {
    match flag {
        MedicalFlag::Pacemaker => "pacemaker",
        MedicalFlag::Pregnant => "pregnancy",
        MedicalFlag::AcuteInjury => "acute injury",
        MedicalFlag::EpilepsyHistory => "epilepsy history",
        MedicalFlag::HeartCondition => "heart condition",
        MedicalFlag::Under18 => "minor (under 18)",
    }
}

fn run_rules(input: &Input) -> Output {
    let flags = input
        .cart
        .buyer_identity
        .as_ref()
        .and_then(|b| b.customer.as_ref())
        .and_then(|c| c.medical_flags.as_ref())
        .map(|m| parse_flags(&m.value))
        .unwrap_or_default();

    if flags.is_empty() {
        return Output::default();
    }

    let mut errors = Vec::new();
    for line in &input.cart.lines {
        let Merchandise::ProductVariant { product } = &line.merchandise else {
            continue;
        };
        let Some(contras) = &product.contraindications else {
            continue;
        };
        for (tag, flag) in conflicts_for_line(&contras.value, &flags) {
            let _ = tag; // tag identity is encoded in flag label below
            errors.push(ValidationError {
                localized_message: format!(
                    "{} is contraindicated for {}. A clinician review is required before purchase.",
                    product.title,
                    flag_label(flag),
                ),
                target: format!("cart.lines.{}", line.id),
            });
        }
    }

    Output { errors }
}

// ---------------------------------------------------------------------------
// WASM entry point. Shopify's Function runtime hands us stdin as JSON,
// expects JSON on stdout. Rust stdlib stdio works on wasm32-wasip1.
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

// Harmless `main` for non-wasm compile targets (tests).
#[cfg(not(target_arch = "wasm32"))]
fn main() {}

// ---------------------------------------------------------------------------
// Tests — pure rules core only, no Shopify mocks needed.
// ---------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;

    fn mk_input(flags_csv: &str, lines: Vec<(&str, &str)>) -> Input {
        Input {
            cart: Cart {
                lines: lines
                    .into_iter()
                    .enumerate()
                    .map(|(i, (title, contras))| CartLine {
                        id: format!("gid://shopify/CartLine/{i}"),
                        merchandise: Merchandise::ProductVariant {
                            product: Product {
                                title: title.to_string(),
                                contraindications: if contras.is_empty() {
                                    None
                                } else {
                                    Some(Metafield {
                                        value: contras.to_string(),
                                    })
                                },
                                fda_class: None,
                            },
                        },
                    })
                    .collect(),
                buyer_identity: Some(BuyerIdentity {
                    customer: Some(Customer {
                        medical_flags: if flags_csv.is_empty() {
                            None
                        } else {
                            Some(Metafield {
                                value: flags_csv.to_string(),
                            })
                        },
                    }),
                }),
            },
        }
    }

    #[test]
    fn pacemaker_plus_tens_blocks() {
        let out = run_rules(&mk_input("pacemaker", vec![("TENS/EMS Unit", "pacemaker")]));
        assert_eq!(out.errors.len(), 1);
        assert!(out.errors[0].localized_message.contains("TENS/EMS Unit"));
        assert!(out.errors[0].localized_message.contains("pacemaker"));
    }

    #[test]
    fn pregnancy_plus_abdominal_ems_blocks() {
        let out = run_rules(&mk_input(
            "pregnant",
            vec![("Abdominal EMS Belt", "pregnant,heart-condition")],
        ));
        assert_eq!(out.errors.len(), 1);
        assert!(out.errors[0].localized_message.contains("pregnancy"));
    }

    #[test]
    fn multiple_flags_multiple_products_each_conflict_reported() {
        let out = run_rules(&mk_input(
            "pacemaker,pregnant",
            vec![
                ("TENS Device", "pacemaker"),
                ("Vagus Nerve Stim", "pregnant"),
                ("Foam Roller", ""),
            ],
        ));
        assert_eq!(out.errors.len(), 2);
    }

    #[test]
    fn no_customer_flags_passes() {
        let out = run_rules(&mk_input("", vec![("TENS Device", "pacemaker")]));
        assert!(out.errors.is_empty());
    }

    #[test]
    fn no_contraindication_tags_passes() {
        let out = run_rules(&mk_input(
            "pacemaker,pregnant",
            vec![("Foam Roller", ""), ("Mobility Set", "")],
        ));
        assert!(out.errors.is_empty());
    }

    #[test]
    fn no_conflict_when_tags_dont_match_flags() {
        let out = run_rules(&mk_input(
            "pacemaker",
            vec![("Meditation Trainer", "pregnant")],
        ));
        assert!(out.errors.is_empty());
    }

    #[test]
    fn unrecognised_flag_strings_are_ignored() {
        let out = run_rules(&mk_input(
            "pacemaker,hypothermia,pregnant",
            vec![("TENS Device", "pacemaker,cryogenic-sickness")],
        ));
        // Only pacemaker→pacemaker matches.
        assert_eq!(out.errors.len(), 1);
    }

    #[test]
    fn error_target_references_line_id() {
        let out = run_rules(&mk_input("pacemaker", vec![("TENS Device", "pacemaker")]));
        assert!(out.errors[0].target.starts_with("cart.lines."));
    }

    #[test]
    fn under_18_gates_restricted_item() {
        let out = run_rules(&mk_input(
            "under-18",
            vec![("Peptide Stack", "under-18,pregnant")],
        ));
        assert_eq!(out.errors.len(), 1);
        assert!(out.errors[0].localized_message.contains("minor"));
    }
}
