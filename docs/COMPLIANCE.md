# Legal and compliance overview

Updated 2026-09-24. Detailed register with sources, owners and evidence requirements: [PRODUCTION-APPLICABILITY.md](PRODUCTION-APPLICABILITY.md).

> **This is not legal advice and not a compliance certificate.** RegenAI is currently a portfolio demo with fictional products, no real sales and no payment processing. This document maps the laws and standards a real merchant launch on this platform would have to address, and how the architecture supports them. Which rules actually apply depends on the real seller, products, customers, locations and data — and must be decided with qualified counsel before launch.

## 1. Summary

| Area | Key rules (US / EU) | How the platform supports it | Launch status |
|---|---|---|---|
| Payments | PCI DSS | Card data handled only by Shopify-hosted checkout (Shopify is certified PCI DSS Level 1) | Architecture ready; merchant's own PCI self-assessment still required |
| Privacy | GDPR, ePrivacy/cookie rules; CCPA/CPRA and other US state laws | Data minimisation, no tracking by default, Shopify privacy tools — see [PRIVACY.md](PRIVACY.md) | Demo: collects no personal data. Real launch: planned |
| Consumer health data | GDPR Article 9; Washington My Health My Data Act; FTC Health Breach Notification Rule; HIPAA only if the business is a covered entity or business associate | Finder answers not persisted; health flags opt-in only; never in telemetry | Legal review required before any health data is stored |
| Health product claims | FTC Act (substantiation); FDA device rules; EU MDR/GPSR and CE marking where applicable | Claim-review queue in the merchant app (partial); demo labelled fictional | Demo makes no clinical claims. Real products need per-product classification |
| Consumer protection | EU distance-selling and withdrawal rights; FTC endorsement rules; US state auto-renewal laws | Clear pricing, shipping, returns and subscription terms in the storefront | Planned — required before real sales |
| Accessibility | EU European Accessibility Act; ADA (US) | WCAG 2.2 AA engineering target — see [ACCESSIBILITY.md](ACCESSIBILITY.md) | Partially tested |
| Marketing | CAN-SPAM, TCPA (US); GDPR/ePrivacy consent (EU) | No marketing messages sent by the demo | Planned |
| AI features | EU AI Act transparency duties where applicable | Current recommendations are rule-based, not AI; any AI feature disclosed and reviewed | Not applicable today |
| Tax | US sales tax, EU VAT | Shopify tax settings; tax advice required per market | Merchant responsibility |

## 2. Payments — PCI DSS

- RegenAI never receives, stores or transmits card numbers. Payment happens on Shopify's hosted checkout.
- Shopify states it is certified Level 1 PCI DSS compliant and publishes compliance reports ([Shopify PCI](https://www.shopify.com/security/pci-compliant), [compliance reports](https://www.shopify.com/legal/compliance/reports)).
- A real merchant still completes its own self-assessment with its payment provider. Using hosted checkout narrows scope; it does not remove every merchant obligation.
- The storefront's strict Content Security Policy and absence of third-party scripts reduce the risk of script-based skimming on pages that lead to checkout.

## 3. Privacy — EU (GDPR) and US state laws

**EU / EEA (GDPR):** a lawful basis for each processing purpose; transparent notices; data-subject rights (access, deletion, portability, objection); processor agreements; records of processing; international transfer mechanisms; breach notification to the supervisory authority within 72 hours where required (Article 33). Fines can reach €20 million or 4% of worldwide annual turnover, whichever is higher (Article 83). Cookie consent under ePrivacy rules applies before non-essential storage — the demo's only storage is the functional demo bag.

**United States:** comprehensive state privacy laws (California CCPA/CPRA and others) apply based on revenue and data-volume thresholds; they grant access, deletion and opt-out rights and in several states require honouring Global Privacy Control. Consumer health data laws (notably Washington's My Health My Data Act) apply to wellness data even where HIPAA does not.

**Platform approach:** see [PRIVACY.md](PRIVACY.md) — minimisation, no default tracking, Shopify mandatory privacy webhooks, a processor register and redacted telemetry.

## 4. Health and wellness products

Recovery and wellness products sit close to medical-device rules:

- **US — FDA:** whether a product is a medical device depends on its intended use and the claims made about it ([FDA guidance](https://www.fda.gov/medical-devices/classify-your-medical-device/how-determine-if-your-product-medical-device)). Claims can turn a general-wellness product into a regulated device.
- **US — FTC:** health claims need competent and reliable scientific evidence; reviews and endorsements must be genuine and disclosed ([FTC Health Products Compliance Guidance](https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance)).
- **EU:** the Medical Device Regulation, General Product Safety Regulation and CE marking may apply depending on the product.

**Platform approach:** the merchant app includes a claim-review queue scaffold (read-only listing today; submission and approval flow planned) designed to route product-copy changes for review before publication; its schema records evidence level and device classification. The demo uses visibly fictional products and states that it gives no diagnosis or treatment advice.

## 5. Accessibility

The EU European Accessibility Act applies to many e-commerce services from 28 June 2025, subject to exemptions (for example, for micro-enterprises). In the US, courts have applied the ADA to online stores. RegenAI targets WCAG 2.2 Level AA as its engineering standard. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for tested scope and gaps.

## 6. What a real launch requires

1. Identify the seller, markets, products and data flows.
2. Complete the applicability register ([PRODUCTION-APPLICABILITY.md](PRODUCTION-APPLICABILITY.md)) with a decision and owner for every row.
3. Qualified legal review of privacy notices, terms of sale, health claims and product classification.
4. Close security release blockers ([SECURITY-MODEL.md](SECURITY-MODEL.md)).
5. Publish real policies (privacy, terms, shipping, returns, accessibility statement) that describe the actual business. Policy pages in the demo are placeholders for a fictional store.

No badge, template or tool result in this repository should be read as a claim of GDPR, CCPA, HIPAA, PCI, ADA or FDA compliance.
