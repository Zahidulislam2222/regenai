# Privacy and data inventory

Updated 2026-10-08. Related: [COMPLIANCE.md](COMPLIANCE.md), [SECURITY-MODEL.md](SECURITY-MODEL.md), [Support Studio](ASSISTANT.md).

## Part A — Current storefront and support service

The main storefront has ordering closed and collects no payment. The same domain also hosts Support Studio and customer AI chat. Support inputs can contain personal information, so the former claim that the site collects no personal data no longer applies.

| Data | Current processing | User control |
| --- | --- | --- |
| Finder choices | Stay in page memory; no saved health profile or model request | Leave or reset the finder |
| Assistant session | Secure HttpOnly cookie; server stores its digest and isolated workspace | Sign out or expire the session |
| Chat text and saved preferences | Encrypted records on the server; included in configured model requests when AI is enabled | Erase conversation deletes messages, preferences and retrieved chat context |
| Image attachments | Sent to the configured model for analysis; attachment bytes are not persisted | Attach only information you intend to share |
| Voice | Optional browser speech service may process audio; playback uses browser voices | Type instead, or leave voice controls off |
| Support tickets and approvals | Encrypted operational records, history and audit; may include supplied email and order details | Export privately; audit/history remain after conversation erasure |
| Owner and connector credentials | Server-only secrets and encrypted connector records; never returned to the browser | Owner manages delegated access and revocation |
| Payment information | No payment form, card processing or enabled public checkout | Ordering remains closed |

Public workspaces are removed under the configured retention policy by scheduled maintenance. The current default is seven days; sessions share that default lifetime. Merchant operational records require an owner-managed retention/export process. Encryption covers record payloads, while categories, identifiers and timestamps remain structural database metadata. No multi-client isolation claim is made: each client needs a separate database and deployment.

### Processors and delivery

Cloudflare and Caddy deliver the site and process network metadata. Hydrogen reads the Shopify catalog. The Python service stores support records. When enabled, model requests go through OpenRouter to the explicitly configured upstream model. Requesting restricted provider data collection is not proof of a provider's retention behavior; review the applicable processor terms before handling client data. Browser voice processing depends on the browser's service.

The deployed assistant response uses private, no-store, no-transform and a strict Content Security Policy. A public-edge response check found no injected analytics script. This does not establish a complete infrastructure log-retention audit or legal compliance.

Avoid entering passwords, payment details or sensitive health information. The finder provides browsing assistance; sensitive support issues require human review. Full privacy/legal review and verified client consent remain prerequisites for customer operations.

## Part B — Privacy design for the full platform

When the Hydrogen storefront connects to a real Shopify store, personal data will be processed. These principles are release requirements, not optional features.

### Data map (planned)

| Data | Source | Stored in | Purpose | Retention principle |
|---|---|---|---|---|
| Customer account (name, email) | Shopify Customer Account API | Shopify | Orders, account | Shopify customer lifecycle; deletion via Shopify privacy requests |
| Orders, addresses, payment | Shopify checkout | Shopify | Fulfilment, legal records | Merchant's legal retention period |
| Cart | Storefront API | Shopify cart; cart ID in a cookie | Shopping | Cart expiry |
| Recovery-finder answers | Browser | **Not persisted by default** | Product suggestion | Ephemeral; never sent to analytics, logs, email or AI providers |
| Health-related flags (e.g. contraindications used by the `cart-contraindication` Function) | Customer, only with explicit consent | Shopify customer metafield | Safety check at checkout | Minimised; explicit opt-in; deletable; requires legal review before launch (see below) |
| Merchant staff session and OAuth token | Shopify OAuth | Merchant app database (encrypted — release blocker SEC-01) | App access | Until uninstall + short grace period |
| Email-only privacy request contact | Shopify compliance webhook | Merchant app D1, shop-bound AES-GCM ciphertext | Let authorized merchant staff identify and handle a request | Cleared when linked or resolved; all shop rows cleared on shop redaction |
| Server logs | All requests | Log platform | Security and debugging | Redacted; bounded retention (e.g. 30 days) |

### Principles

1. **Data minimisation.** Collect only what a feature needs. Ordinary shopping never requires health information.
2. **Health data is special.** Recovery and wellness answers can reveal health information. Under GDPR Article 9 this can be special-category data, and US laws such as Washington's My Health My Data Act regulate consumer health data outside HIPAA. Any persistence of such data requires explicit consent, a documented purpose, access restriction and a completed legal review.
3. **No sensitive data in telemetry.** Automated tests must assert that finder answers, health flags and tokens never reach logs, analytics or error reports.
4. **Consent before optional tracking.** If analytics are added, they stay off until the visitor opts in (EU) and honour opt-out signals such as Global Privacy Control where required (US states).
5. **Rights handling.** Access, deletion and export requests flow through Shopify's customer privacy tools and the mandatory Shopify privacy webhooks (`customers/data_request`, `customers/redact`, `shop/redact`), which the merchant app must implement before App Store or merchant use.
6. **Processors documented.** Every vendor that receives personal data is listed with its role, location and transfer mechanism before launch.

### Status

| Item | Status |
|---|---|
| Assistant data processing and erase controls | **Verified** by source and real HTTP checks; broader infrastructure retention review remains due |
| Finder answers not persisted | **Verified** in source (in-memory state only) |
| Telemetry redaction tests | **Built** for the storefront server logger; full coverage planned |
| Shopify mandatory privacy webhooks | **Locally built and HTTP-tested**; remote D1 migrations, subscriptions, real delivery and operational response are unverified, so merchant release remains blocked |
| Consent management | **Planned** (only needed if optional tracking is added) |
| Processor register and legal review | **Planned** — required before real customers |
