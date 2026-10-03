# Privacy and data inventory

Updated 2026-10-04. Related: [COMPLIANCE.md](COMPLIANCE.md), [SECURITY-MODEL.md](SECURITY-MODEL.md), [PRODUCTION-APPLICABILITY.md](PRODUCTION-APPLICABILITY.md).

This document has two parts: a **privacy notice for the live demo** (what actually happens today), and the **privacy design for the full platform** (what must be true before real customers use it). It is an engineering document, not legal advice.

## Part A — Live demo privacy notice

Applies to `https://regenai.zahidul-islam.com`, a portfolio demonstration with fictional products. Nothing is sold and no payment can be made.

### What the demo collects

| Data | Collected? | Details |
|---|---|---|
| Name, email, address, account | **No on the main site** | Main Account and public cart writes are closed; the separate staging site has a test-only Shopify Account sign-in entry |
| Payment details | **No** | Public checkout is closed; the main site has no payment form |
| Recovery-finder answers | **Not stored or sent** | Answers stay in the open page's memory and are discarded when you leave. The finder states this on screen |
| Demo bag contents | **No active bag on the main Hydrogen site** | The current main layout disables the legacy browser bag, and public cart writes remain closed. Old local storage from the earlier static demo may remain until browser site data is cleared |
| Analytics and advertising | **No first-party integration in the current source** | Infrastructure still processes request metadata to serve and protect the site |

### What infrastructure processes

| Processor | What it sees | Why |
|---|---|---|
| Cloudflare (DNS, TLS, proxy) | IP address, request metadata, headers | Delivering and protecting the site. Governed by [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/). Cloudflare also sets a Network Error Logging header: successful requests are not reported, but browsers may send network-failure reports to Cloudflare |
| Hydrogen application server | Storefront requests and Shopify catalog responses | Server-rendered product browsing; current source uses a redacted error logger. Full infrastructure log retention still needs an operational audit |
| Reverse proxy (Caddy) | Request routing | The RegenAI site block does not enable an access log |

### Your choices

The main demo has no buyer account to access or delete. To remove any old static-demo bag data, clear this site's browser storage. Questions: open an issue on the [GitHub repository](https://github.com/Zahidulislam2222/regenai/issues) (do not include personal information).

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
| Live demo collects no personal data beyond network delivery | **Verified** by source inspection and release browser checks |
| Finder answers not persisted | **Verified** in source (in-memory state only) |
| Telemetry redaction tests | **Built** for the storefront server logger; full coverage planned |
| Shopify mandatory privacy webhooks | **Locally built and HTTP-tested**; remote D1 migrations, subscriptions, real delivery and operational response are unverified, so merchant release remains blocked |
| Consent management | **Planned** (only needed if optional tracking is added) |
| Processor register and legal review | **Planned** — required before real customers |
