# Privacy and data inventory

Updated 2026-09-24. Related: [COMPLIANCE.md](COMPLIANCE.md), [SECURITY-MODEL.md](SECURITY-MODEL.md), [PRODUCTION-APPLICABILITY.md](PRODUCTION-APPLICABILITY.md).

This document has two parts: a **privacy notice for the live demo** (what actually happens today), and the **privacy design for the full platform** (what must be true before real customers use it). It is an engineering document, not legal advice.

## Part A — Live demo privacy notice

Applies to `https://regenai.zahidul-islam.com`, a portfolio demonstration with fictional products. Nothing is sold and no payment can be made.

### What the demo collects

| Data | Collected? | Details |
|---|---|---|
| Name, email, address, account | **No** | The demo has no sign-up, login, newsletter or contact form |
| Payment details | **No** | Checkout is a demonstration; no payment form exists |
| Recovery-finder answers | **Not stored or sent** | Answers stay in the open page's memory and are discarded when you leave. The finder states this on screen |
| Demo bag contents | **Stored only in your browser** | Saved in your browser's `localStorage` under `regenai:demo-bag:v1` so the bag survives a refresh. Never sent to a server. Clear it by emptying the bag or clearing site data |
| Analytics, advertising or tracking cookies | **None** | No third-party scripts; the Content Security Policy limits page connections to this origin |

### What infrastructure processes

| Processor | What it sees | Why |
|---|---|---|
| Cloudflare (DNS, TLS, proxy) | IP address, request metadata, headers | Delivering and protecting the site. Governed by [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/). Cloudflare also sets a Network Error Logging header: successful requests are not reported, but browsers may send network-failure reports to Cloudflare |
| Web server (Nginx container) | Request status and method only | Operational logging; IP addresses, URLs, query strings and referrers are not written by the application container |
| Reverse proxy (Caddy) | Request routing | The RegenAI site block does not enable an access log |

### Your choices

Because the demo does not collect personal data about you beyond what the network provider processes to deliver the page, there is no account to access or delete. To remove the demo bag, empty it or clear this site's data in your browser. Questions: open an issue on the [GitHub repository](https://github.com/Zahidulislam2222/regenai/issues) (do not include personal information).

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
| Shopify mandatory privacy webhooks | **Planned** |
| Consent management | **Planned** (only needed if optional tracking is added) |
| Processor register and legal review | **Planned** — required before real customers |
