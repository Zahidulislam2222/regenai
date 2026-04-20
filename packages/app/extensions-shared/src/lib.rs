//! Shared types for every RegenAI Shopify Function extension.
//!
//! Metafield keys and enum values live here so a rename in one place
//! propagates to all four Functions at `cargo check` time. Each variant
//! maps to a string value stored in a Shopify metaobject or metafield.

#![cfg_attr(not(test), no_std)]

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// FDA device class — surfaced on product metafield `regenai.fda_class`.
// ---------------------------------------------------------------------------
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum FdaClass {
    #[serde(rename = "Class I")]
    ClassI,
    #[serde(rename = "Class II")]
    ClassII,
    #[serde(rename = "Class III")]
    ClassIII,
    #[serde(rename = "N/A")]
    NotApplicable,
}

// ---------------------------------------------------------------------------
// Contraindication flags — stored on customer metafield
// `regenai.medical_flags` as a comma-separated list of these values.
// ---------------------------------------------------------------------------
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MedicalFlag {
    Pacemaker,
    Pregnant,
    AcuteInjury,
    EpilepsyHistory,
    HeartCondition,
    Under18,
}

impl MedicalFlag {
    pub fn parse(raw: &str) -> Option<Self> {
        match raw.trim() {
            "pacemaker" => Some(Self::Pacemaker),
            "pregnant" => Some(Self::Pregnant),
            "acute-injury" => Some(Self::AcuteInjury),
            "epilepsy-history" => Some(Self::EpilepsyHistory),
            "heart-condition" => Some(Self::HeartCondition),
            "under-18" => Some(Self::Under18),
            _ => None,
        }
    }
}

// ---------------------------------------------------------------------------
// Product contraindication tags — product metafield
// `regenai.contraindications` carries a comma-separated list.
// Matching rule: if any tag on the product matches any flag on the
// customer, the combination is blocked.
// ---------------------------------------------------------------------------
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ContraTag {
    /// Do not use if customer has a pacemaker (TENS, EMS, high-intensity
    /// electrical stimulation devices).
    Pacemaker,
    /// Pregnancy contraindication — vagus-nerve stim, abdominal TENS,
    /// certain supplements.
    Pregnant,
    /// Acute injury requires medical sign-off first.
    AcuteInjury,
    /// Epilepsy-history blocks flashing lights / vagal stim / neural trainers.
    EpilepsyHistory,
    /// Heart condition blocks vigorous percussion + cold immersion.
    HeartCondition,
    /// Age-gate — purchaser must be 18+.
    Under18,
}

impl ContraTag {
    pub fn parse(raw: &str) -> Option<Self> {
        match raw.trim() {
            "pacemaker" => Some(Self::Pacemaker),
            "pregnant" => Some(Self::Pregnant),
            "acute-injury" => Some(Self::AcuteInjury),
            "epilepsy-history" => Some(Self::EpilepsyHistory),
            "heart-condition" => Some(Self::HeartCondition),
            "under-18" => Some(Self::Under18),
            _ => None,
        }
    }

    /// Returns `true` if this product tag conflicts with the given customer
    /// flag. Right now the mapping is 1:1 (same keys) — but keeping the
    /// indirection so future rules like "pregnant disallows `acute-nsaid`"
    /// don't have to relax the type system.
    pub fn conflicts_with(self, flag: MedicalFlag) -> bool {
        matches!(
            (self, flag),
            (Self::Pacemaker, MedicalFlag::Pacemaker)
                | (Self::Pregnant, MedicalFlag::Pregnant)
                | (Self::AcuteInjury, MedicalFlag::AcuteInjury)
                | (Self::EpilepsyHistory, MedicalFlag::EpilepsyHistory)
                | (Self::HeartCondition, MedicalFlag::HeartCondition)
                | (Self::Under18, MedicalFlag::Under18)
        )
    }
}

// ---------------------------------------------------------------------------
// B2B company tier — Company metafield `regenai.tier`.
// ---------------------------------------------------------------------------
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum CompanyTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
}

impl CompanyTier {
    pub fn parse(raw: &str) -> Option<Self> {
        match raw.trim() {
            "bronze" => Some(Self::Bronze),
            "silver" => Some(Self::Silver),
            "gold" => Some(Self::Gold),
            "platinum" => Some(Self::Platinum),
            _ => None,
        }
    }

    /// Returns the base discount percentage for this tier (in whole %).
    pub fn base_discount_pct(self) -> u8 {
        match self {
            Self::Bronze => 5,
            Self::Silver => 10,
            Self::Gold => 15,
            Self::Platinum => 20,
        }
    }
}
