# Production applicability register

Updated 2026-10-08. This register combines current engineering facts and unresolved business/legal decisions. Public ordering is closed, while the assistant processes supplied chat/support information. Legal duties depend on actual activity and data, not the project label. Keep an applicability rationale, accountable person, dated source check, implementation evidence and re-review trigger for each row.

## Register

| ID / area | Current evidence | Required launch decision and proof | Accountable role | Re-review trigger |
|---|---|---|---|---|
| PA-01 — visitor data and consent | No default analytics in inspected release; chat stores encrypted messages/preferences and secure session identifiers | Actual data/vendor inventory, lawful basis/notice, required consent/choice, logs and transfer review; validate reject/withdraw where needed | Client privacy owner and engineer | New vendor, purpose, audience or tracking |
| PA-02 — finder/health inference | Active finder uses in-memory body-focus/rhythm/preferences; no saved health profile. Legacy condition filters need separate route assessment | Classify actual questions/inferences/linkage; avoid sensitive telemetry; review any storage, AI transfer, health flags and legal conditions | Product/privacy/security owners | New fields, persistence or medical/sensitive use |
| PA-03 — accessibility | Bounded axe, keyboard, mobile/reduced-motion and zoom evidence; full screen-reader journey remains due | Applicable duty/exemption decision, complete journey review, contrast/reflow/error/announcement checks and dated limitations | Accessibility and legal owners | UI changes and commerce activation |
| PA-04 — product claims and reviews | Six owned Shopify catalog records and original media; ordering closed; no clinical proof claimed | Actual merchandise, provenance, claims/net-impression substantiation, classification, safety/labeling and endorsement evidence | Product/claims owner and qualified reviewer | Product/claim/market change |
| PA-05 — checkout/payment | Public cart writes/checkout closed; development-store gateway/form checked without completed order | Merchant/payment-mode decision; eligible activation and complete development-store order proof; PCI/seller review before live payment | Store owner and commerce engineer | Payment/store/environment change |
| PA-06 — jurisdiction and seller duties | No verified real-sales business facts | Seller identity, countries/states, taxes, price/delivery/returns/subscriptions, product restrictions and qualified review | Merchant/legal/tax owners | New offer, product or market |
| PA-07 — security and privacy claims | Source scans and scoped auth/isolation/encryption tests; remaining merchant and development-tool gaps | Independent security assessment, vendor/retention/rights review, incident process and precise public claims | Security/privacy owners | Material release or exposure |
| PA-08 — AI transparency and evaluation | Disclosed configured AI, two bounded multilingual/image/recommendation checks, human-action approval | Provider/deployer classification, transparency, relevant decision rights, prompt-injection/quality evaluation and policy ownership | Client AI/product owner and counsel | Model, use case, jurisdiction or decision impact |
| PA-09 — inbox and protected order data | Shopify read/write scopes with renewal/read proof; Gmail delegated installed-client grant, label-only empty import | Authorized data access, scopes, protected-data permission, Google consent strategy, actual matching/refund/reply proof and client agreements | Store/inbox owner and implementation engineer | Revocation, consent/scopes or workflow change |
| PA-10 — uptime and operational promises | One host; release/restart parity evidence; no observed 30-day uptime or capacity tier result | Monitoring, measured SLOs, recovery/rollback, staffing, budgets and contractual service terms | Operations and business owners | New SLA, workload or infrastructure |

All merchant-specific legal decisions remain unresolved until the responsible owner supplies the actual business facts and qualified review. Locally tested controls can support a decision but cannot make that decision alone. A row is non-applicable only with a written factual rationale; unknown does not mean non-applicable.

## Official sources and evidence

| Rows | Reference |
|---|---|
| PA-01/02/07 | [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), [California privacy guidance](https://oag.ca.gov/privacy/ccpa), [FTC health breach rule](https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule), [HIPAA roles](https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html) |
| PA-03 | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/); [project accessibility evidence](ACCESSIBILITY.md) |
| PA-04 | [FTC health claims](https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance), [FDA intended use](https://www.fda.gov/medical-devices/classify-your-medical-device/how-determine-if-your-product-medical-device) |
| PA-05/06 | [Shopify payment security](https://www.shopify.com/security/pci-compliant), [EU consumer contracts](https://commission.europa.eu/law/law-topic/consumer-protection-law/consumer-contract-law_en) |
| PA-08 | [EU AI transparency guidance](https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) |
| PA-09 | [Google OAuth expiry](https://developers.google.com/identity/protocols/oauth2#expiration), [Shopify limits](https://shopify.dev/docs/api/usage/limits), [operator guide](ASSISTANT.md) |
| PA-10 | [Reliability objectives](RELIABILITY.md), [capacity plan](SCALABILITY.md), [SRE SLOs](https://sre.google/workbook/implementing-slos/) |

Sources were researched for this publication on 2026-10-08; recheck current text and jurisdiction-specific law before activation. The GDPR official page's automated browser response prevented full text retrieval in this session; its link is a law reference, not a claim of article-by-article legal validation.

## Review record required per activation

Record the feature and release, actual seller/client role, affected jurisdictions/data, applicable or non-applicable rationale, named reviewer, source/date, contract/policy decisions, gate results, remaining limits and next review. Keep client identities and confidential evidence in private client records; public summaries contain scrubbed outcomes only.
