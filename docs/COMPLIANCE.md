# Legal and compliance overview

Updated 2026-10-08. RegenAI currently provides a Shopify-backed catalog and AI support service with public ordering closed. Chat and connected support information can contain personal data regardless of whether sales are enabled. This engineering map identifies review requirements; a qualified reviewer must determine applicability for the actual business, markets, products, data and contractual roles.

## Applicable-law map

| Area | Review required | Current engineering support / launch gate |
|---|---|---|
| EU/EEA privacy | GDPR: purposes/lawful basis, transparency, rights, processors, transfers, security and applicable breach handling | Encrypted records, bounded context, erase/export controls; actual role/lawful-basis/DPA/retention review remains due |
| US privacy | State privacy rules depend on business/data thresholds and jurisdiction; consumer health data can have separate rules | Data inventory and client isolation; current applicability decisions and opt-out/consent implementation where required remain due |
| Health information | GDPR special-category conditions; HIPAA where covered-entity/business-associate roles apply; FTC health breach rules where in scope | Finder answers are ephemeral; sensitive support requires human review; no general HIPAA assertion |
| AI transparency/governance | Determine provider/deployer roles and applicable EU AI Act classification/transparency obligations | AI assistance is disclosed, policy checks and human approval remain separate; risk assessment and vendor obligations require review |
| Product claims and safety | FTC substantiation, FDA intended-use/device classification, applicable EU product/device rules | Ordering closed, no clinical evidence claims; actual products and claims require qualified approval |
| Consumer transactions | Seller identity, accurate prices, delivery/returns, withdrawal/renewal rights and refund obligations by market | Public policy pages describe present limits; commercial policies must reflect the actual merchant before sales |
| Payments | Hosted payment architecture narrows PCI scope; merchant/payment-provider responsibilities remain | No card collection in RegenAI; public checkout closed; merchant scope assessment before activation |
| Accessibility | Applicable commerce accessibility duties and exemptions require jurisdiction/business review | WCAG 2.2 AA engineering target, bounded automated/manual checks; complete conformance review remains due |
| Marketing | CAN-SPAM/TCPA and applicable consent/opt-out laws depend on channel and purpose | Current release sends no marketing; customer support permission does not establish marketing consent |
| Tax and seller operations | Sales tax/VAT, shipping destinations, product restrictions and contractual terms | Merchant-specific configuration and qualified tax/legal review before sales |

## Privacy and incident review

Assess each purpose: chat response, saved memory, order matching, email import, human handoff, audit, backups and optional voice/image processing. Determine who controls the data, who processes it, vendor/subprocessor locations, transfer mechanisms, retention and rights exceptions. Client installation requires delegated access and consent with minimum scopes. Conversation erasure and financial/audit retention have different effects and must be disclosed.

GDPR Article 33 uses a 72-hour supervisory-authority notification requirement where applicable and feasible; applicability, awareness, risk and processor/controller responsibilities need incident-specific assessment. Other laws have different recipients/timelines. The incident plan must preserve evidence and involve the privacy/legal owner rather than assume one deadline for all users. [GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), [California Attorney General guidance](https://oag.ca.gov/privacy/ccpa).

HIPAA applies to defined covered entities and business associates; wellness branding alone does not decide it. Separately assess consumer health and health-app breach rules before storing health-related support content. [HHS role guidance](https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html), [FTC Health Breach Notification Rule](https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule).

## AI and support automation

The assistant generates recommendations with configured provider budgets and human approval for external actions. Record model routing, retention terms, evaluation limitations, policy ownership and escalation responsibilities. Assess automated-decision consequences separately from ordinary support drafting; an AI feature should not silently make consequential customer decisions.

European Commission guidance states Article 50 transparency obligations apply from 2 August 2026. Determine the actual system/role/content obligations and applicable exceptions; a support chatbot is not automatically a high-risk system merely because it uses AI. [Official transparency guidance](https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems). Maintain risk/evaluation records using the voluntary [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) as an engineering reference.

Google inbox access additionally requires compliance with selected scopes, OAuth consent/verification and provider user-data policies. The current Testing grant can expire after seven days; no shared project audience change is implied by this publication. Protected Shopify customer data requires client-specific permission review.

## Product, payment and consumer boundaries

FTC guidance requires evidence for expressed and implied health-product claims; FDA device analysis considers intended use. A catalog record, 3D model or local claim guard cannot establish clinical performance, approval, certification, stock or fulfillment. Actual products need per-product evidence and market review. [FTC claims guidance](https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance), [FDA intended-use guidance](https://www.fda.gov/medical-devices/classify-your-medical-device/how-determine-if-your-product-medical-device).

The checked-in product-copy guard checks maintained JSON for a narrow set of explicit unsupported promises and publication notices. It does not inspect Shopify edits, implied claims, scientific evidence or product classifications. Keep a qualified review outside that code gate.

Shopify states its platform is PCI DSS Level 1 compliant; using hosted checkout does not settle every merchant obligation. Public ordering remains closed, and development-store checkout evidence must never be presented as a real sale. [Shopify payment security](https://www.shopify.com/security/pci-compliant). For EU sales, assess actual distance-selling terms and consumer rights. [European Commission consumer contract guidance](https://commission.europa.eu/law/law-topic/consumer-protection-law/consumer-contract-law_en).

## Launch decision

Resolve each row in [PRODUCTION-APPLICABILITY.md](PRODUCTION-APPLICABILITY.md) with an accountable owner, current source, applicability rationale and evidence. Publish accurate business policies, contracts and data notices; close security and recovery gates; review accessibility and operational staffing. Applicable unresolved requirements block the corresponding customer-data or sales feature. This map makes no legal certification claim.
