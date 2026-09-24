# RegenAI
## Recovery commerce — live experience, engineering vision and delivery roadmap

Project by Zahidul Islam. Client review edition, updated 24 September 2026.

Live frontend: https://regenai.zahidul-islam.com

RegenAI is a Shopify-focused recovery and wellness commerce portfolio project. The vision is to combine a distinctive shopping experience with dependable commerce, evidence-aware content, responsible recommendations and an architecture that can grow with a real merchant. The current milestone is a publicly deployed visual demo. It is not an operating medical business, a clinically validated product range or a store accepting real payments.

This document separates verified delivery from implementation in progress, planned controls and longer-term ideas. It replaces the earlier day-by-day snapshot; historical CI results, product claims and deployment assumptions are not treated as current proof.

## 1. What clients can review today

The selected new design is live on its own HTTPS subdomain. It uses a warm neutral background, blue accents, editorial typography and original product imagery. The experience includes a moving Three.js product scene, scroll-driven product inspection, a lab-inspired visual section, responsive navigation and a persistent demo shopping bag.

The six synthetic product concepts are Pulse One, Form Roller, Range Kit, Restore Wrap, Point Duo and Align Pebble. Collection browsing, search, product details and options, a recovery finder, the bag, informational pages and not-found views are available. Prices, products and specifications are demonstration content rather than an offer for sale. The finder supports product discovery; it does not diagnose a condition or establish medical suitability.

Original Blender scenes and web-ready product assets support the design. The public experience uses optimized images and 3D assets with loading and reduced-motion behavior. An approved generated architectural image supports the visual direction. A paid generated video has not been produced; future video work would need a clear creative benefit, accessibility treatment, performance budget and spending approval.

The bag uses browser-local demonstration state. Its checkout experience does not take payment. Genuine Shopify catalog, server-owned cart, customer accounts, order history and test checkout still need integration and end-to-end acceptance. The public demo deliberately carries noindex controls while real content, SEO and commercial readiness remain under development.

## 2. Delivery status and evidence

VERIFIED — The bounded frontend release passed its seven acceptance criteria and independent review. Dedicated frontend TypeScript checking, linting and production build passed, along with 24 focused recovery component and behavior tests. The release is a built static artifact, not a development server.

VERIFIED — Local and public HTTP checks covered 22 valid and missing routes, plus rejection of unsupported request methods. Chrome checks exercised 3D initialization, scroll chapters, product navigation, bag persistence, keyboard-focus restoration, reduced motion and layouts at 390, 768 and 1440 pixels. The recorded browser run had no uncaught application, hydration or console errors and no unexpected external service requests. These checks describe the exercised journeys, not an exhaustive security or accessibility audit.

VERIFIED — Trusted origin HTTPS and hostname validation succeeded; the public site was served through Cloudflare. All 28 deployed release files and the installed site configuration matched the locally tested candidate byte-for-byte. Existing shared site configurations were preserved. An off-server release archive was extracted and compared successfully. The static bundle and deployment tooling passed the scoped secret scans; Python deployment tooling passed the configured security checks.

IN PROGRESS — Hydrogen/Node runtime work and migration of the selected visual design into the integrated storefront exist in the working tree. Their complete current runtime, shutdown, SSR and commerce acceptance gates are not closed. Earlier foundation and design-system checks are useful history, but do not establish that the latest full repository is ready for a commercial launch.

EXISTING SOURCE, REVALIDATION REQUIRED — The repository contains a merchant application, design-system/Storybook work and four Rust/WASM Shopify Function projects: cart validation, B2B tiered pricing, delivery customization and discount interaction rules. On 24 September 2026 the four Functions passed 47/47 native unit tests and built to WebAssembly at 159–181 KiB each, under Shopify's 256 kB limit. Native runner compatibility, store eligibility, activation and real sandbox checkout behavior still require fresh verification. Source files and old compiled artifacts alone are not proof of enforcement.

KNOWN ISSUE — A development build of the merchant application is deployed at a Cloudflare workers.dev address. Its review page currently has no sign-in and no shop scoping; the review queue was empty when checked on 24 September 2026. It must be secured or taken offline before any real store installs it.

PLANNED — Full privacy, legal applicability, security, SEO, accessibility, performance, observability, availability and scale acceptance work. No million-user benchmark, observed 30-day uptime result, legal certification, clinical validation or full-project production-readiness claim is made.

DOCUMENTED — On 24 September 2026 public architecture, scalability, reliability, security, privacy, compliance and accessibility documents were published in the GitHub repository (see section 13). They describe targets and current evidence; they are not certifications.

## 3. Architecture: current release and intended platform

Current public path: browser → Cloudflare → HTTPS reverse proxy → isolated static frontend container. The container runs without root privileges, with a read-only filesystem, restricted capabilities and bounded resources. Its application listener is private to the host. This is an appropriate visual-review deployment; it does not establish multi-host resilience or protect an unfinished backend by itself.

Target storefront: React and TypeScript with Shopify Hydrogen/React Router server rendering on a validated Node runtime. The selected visual design is retained while replacing fixture-only commerce with typed Shopify catalog, cart and account adapters. Public content may use carefully controlled caching; customer-specific cart, account and administrative responses must remain isolated. Shopify remains the commerce system of record and owns supported checkout and payment processing.

Target merchant layer: an authenticated merchant application with shop-scoped access, review and publishing workflows, versioned content and an auditable decision history. The existing Workers/D1 approach remains a candidate for this layer while authentication, token protection, environment separation and tenant boundaries are repaired and tested. Hosting the storefront on a separately managed server does not replace Shopify or automatically require Oxygen. Platform eligibility and provider limits must be checked for each capability.

Target checkout rules: the four existing Shopify Function projects are evaluated through the supported runner and actual eligible development-store journeys. Rules must use validated, versioned input data, handle missing or malformed data and behave correctly when discounts, currency and delivery options interact. No LLM or arbitrary network dependency belongs in a synchronous checkout validation path.

Target data and recommendation layer: begin with transparent deterministic ranking and an honest no-match fallback. Add retrieval or generation only where a measured benefit justifies the complexity, privacy exposure and cost. A vector database, warehouse or transformation stack is introduced for a concrete retrieval/reporting need, not merely because it appears in an architecture diagram.

Configuration is intended to have one owner for each changing value: validated environment settings for deployment/provider behavior, maintained data files for catalog and business copy, and private secret storage for credentials. Reusable components and a documented design system support consistency across the storefront and future interfaces.

## 4. Shopify commerce and merchant workflow roadmap

Catalog integration will map real development-store products, collections, media, variants, options, currencies and availability into the accepted design. Acceptance includes filtering, sorting, pagination, long and missing content, sold-out variants, timeouts and truthful 404 responses. Fixture mode remains explicit; a failing live API must not silently become a fictional successful product response.

Cart and checkout work will implement authoritative Shopify totals, validated quantity/variant mutations, separate buyer sessions, visible mutation errors and a fresh supported checkout URL. Two-browser isolation, inventory contention, retries and error recovery are required. Testing uses a verified development store and supported test-payment flow; no real charge is implied by deployment or a demonstration.

Customer-account work covers supported sign-in, sign-out, expiry, callback protection and permission-scoped order/address views. Cross-customer access must be denied. Account tokens and sensitive request data must not appear in logs. Export/deletion utilities need authenticated ownership checks and explicit downstream boundaries.

Merchant administration will validate install/session flows, atomic one-time callback state, token encryption and rotation, least-privilege roles and shop isolation on every data query. Review actions need valid transitions, concurrency protection, required reasoning and an append-only audit history. Content must not acquire a fabricated clinician endorsement because an approval button exists.

Webhook and job processing will verify signatures before processing, associate the correct shop, tolerate duplicate and out-of-order deliveries, use idempotency and bounded retries, and support recovery after a worker failure. Uninstall and required privacy topics must remove or revoke the relevant access and data according to the approved lifecycle.

Expanded commerce remains planned: B2B company/location pricing, supported markets and localization, subscription lifecycle and cancellation, eligible checkout extensions, account utilities and explicitly specified affiliate or consultation workflows. Store plan, distribution method, platform grants, business decisions and legal review determine which features can genuinely ship. No premium Shopify capability or subscription is assumed to be available for free.

## 5. Security and trustworthy engineering

The present release has scoped protections: HTTPS, restrictive response headers, a same-origin content policy, demo noindex controls, limited container privileges, protected configuration and a local-first release process. These controls are verified for the static demo; they are not a blanket claim that every repository component is secure.

The public security model, published 24 September 2026, lists nine tracked gaps (SEC-01 to SEC-09). Release blockers cover merchant token encryption at rest, per-request authentication and shop scoping on merchant routes, atomic one-time OAuth state and separated environments; the live demo also lacks an HSTS header. Security issues can be reported privately as described in the repository's security policy.

The next security workstream establishes a threat model and a versioned control mapping using OWASP guidance. It covers authentication and authorization, tenant separation, session rotation, supported administrator MFA, CSRF, XSS, injection, SSRF, redirect/upload validation, trusted proxy handling, bounded request sizes, timeouts and abuse controls. Negative tests must demonstrate the boundaries, not merely a successful happy path.

Secrets must stay out of source, generated browser assets, logs, screenshots and public documentation. Recovery records remain private. Dependency findings must be assessed for the deployed path and corrected or explicitly dispositioned; the broader dependency and runtime audit is not yet complete. An automated scanner result is one layer of evidence, not a security certificate.

The development workflow requires acceptance criteria before changes, narrowly scoped implementation, tests/type/lint/security/build gates, real HTTP or UI exercises and independent review. Genuine CI tests remain versioned; private manual tooling and recovery notes stay excluded. Missing scenarios, unavailable credentials and failing checks must be visible rather than converted into artificial success.

Deployment follows local source → verified artifact → versioned release → targeted activation → public behavior checks → file parity. Release manifests, retained rollback artifacts and checks against live drift make changes reviewable. Existing working services are preserved. The final integrated system will also need independent application security testing and an incident-response exercise before real merchant use.

## 6. USA and EU readiness: an applicability-led plan

The intent is to support clients serving the USA and EU. This requires a maintained, jurisdiction-specific applicability register rather than a promise to satisfy every law. Each applicable obligation needs an accountable owner, current primary source, actual merchant/data/product facts, an implementation control, test evidence and qualified review where appropriate. The following are launch workstreams, not completed legal opinions.

Privacy and visitor data: inventory forms, cookies, browser storage, logs, account data, processors and cross-border transfers. Establish purposes, applicable lawful bases, notices, retention, deletion/export and effective preference withdrawal. Optional analytics or marketing must obey applicable consent/choice rules. EU GDPR and national electronic-communications rules need review; US state privacy laws, including California requirements where applicable, need separate assessment. Merely hosting in Europe does not establish compliance. [1][2]

Recovery-finder and health-related data: assess each field and possible inference, whether it can be linked to a person and where it travels. The design goal is minimal, ephemeral discovery inputs, without sending sensitive answers to advertising, analytics, AI or customer profiles by default. The relevant review may include GDPR special-category data, Washington consumer-health privacy rules and the FTC Health Breach Notification Rule. HIPAA depends on the actual entities, roles and data flows; wellness branding alone does not settle applicability. [1][3][4]

Product claims and safety: synthetic products must remain clearly identified. A real catalog requires evidence for benefits and endorsements, review provenance, safety and traceability obligations, and product-specific US/EU classification. FDA device status depends on intended use and claims. EU medical-device or general-product safety duties must be assessed for the actual goods. No unsupported FDA approval, CE conformity, clinical efficacy, certification badge or artificial customer review should be published. Automated content checks can flag problems but cannot replace regulatory judgment. [5][6]

Consumer commerce: review seller identity/contact, total pricing, tax/shipping presentation, delivery commitments, returns, withdrawal/cancellation rights, warranties, subscriptions and advertising practices for each market. Terms must match the actual offer and checkout. Cross-border VAT/sales-tax, customs and product obligations require the merchant's business facts and appropriate specialists. The current demonstration does not provide approved merchant legal policies. [7]

Accessibility: use WCAG 2.2 AA as an engineering target and separately assess applicable US obligations and the European Accessibility Act, including relevant national implementation and exceptions. An automated scan or accessible component library does not itself prove legal conformance. Product browsing, forms, dialogs and hosted checkout need their own evidence. [8][9]

Payments and operational governance: keep card capture in supported Shopify/payment-provider flows, review payment and PCI responsibilities, and prove test/live environment separation. Define incident notification, processor responsibilities, data-rights handling, evidence ownership and review cadence. If later AI, diagnostics, telehealth, supplements or wearable features materially change the risk profile, reassess the relevant regulatory framework before implementation or public claims.

## 7. Accessibility, motion and inclusive use

The visual ambition includes accessibility. Current checks exercised keyboard focus restoration, responsive layouts and reduced-motion behavior. Earlier scoped frontend reviews also recorded automated accessibility checks; these do not replace a fresh integrated-store assessment or formal conformance evaluation.

Planned acceptance includes semantic landmarks/headings, meaningful alternative text, visible focus, dialog and validation announcements, contrast, touch targets, keyboard-only journeys, screen-reader exercises and 200%/400% zoom/reflow. Test mobile and desktop through the full shopping and account journey, including failure states and supported checkout.

3D and motion must enhance discovery without becoming the only source of product information. Preserve static fallbacks, readable content without WebGL, reduced-motion controls and the ability to use the interface without scroll-driven effects. Future video requires captions or other appropriate alternatives, playback controls and a policy on autoplay and data use.

## 8. Speed, SEO and search-agent visibility

Performance goals cover the real user journey, not only a Lighthouse screenshot. Planned budgets include first-load JavaScript, image/3D/video bytes, request count, main-thread work, server-render latency and cache behavior. The current Three.js bundle remains a material optimization area. Measure representative devices and networks, and distinguish controlled lab results from real-user field data.

The intended field-performance goals are p75 LCP at or below 2.5 seconds, INP at or below 200 milliseconds and CLS at or below 0.1, once there is sufficient representative traffic. These are targets, not measured outcomes of the present release. Use lazy-loaded enhancement, responsive media, careful fonts, bounded third-party code and public-only caching, then verify the tradeoffs. [10]

Traditional SEO work includes meaningful server-rendered HTML, truthful HTTP status codes, canonical URLs, sitemaps, internal links, appropriate localization/hreflang, visible-content-consistent product/offer/breadcrumb metadata and eligible merchant feeds. Do not publish structured-data ratings or stock claims that the visitor cannot substantiate. Private, account, cart and staging content must have appropriate crawl controls.

Search-agent optimization means making accurate product and business information accessible to supported search and assistant systems. Priorities are clear entities, concise factual descriptions, reliable URLs, provenance, machine-readable data and explicit crawler/access policies. Google states that its AI search features do not require special additional optimization beyond established SEO practices; eligibility and inclusion remain under the platform's control. Other agents require their own current documentation and capability review. No ranking, citation, recommendation or agent-driven sale is guaranteed. [11]

The public demo currently remains noindex. Search Console validation, indexability decisions, merchant feeds and agent-facing commerce integrations belong to the later approved commercial/content release, not this visual-review milestone.

## 9. Scalability: a credible path from 10k to 1M+ simultaneous users

The objective is an architecture that can evolve toward 10,000, 100,000 and more than 1,000,000 simultaneous active users for a defined workload. These are design scenarios, not demonstrated capacity. Concurrent open tabs, active sessions, requests per second and simultaneous checkout mutations are different measurements and must never be substituted for one another.

The codebase should make future growth understandable: typed configuration, explicit cache/session/job/telemetry boundaries, stateless request handling where appropriate, public/private cache separation, controlled dependency access, durable job processing and repeatable deployment definitions. Some supported upgrades may eventually require configuration changes; independent hosts, data migrations, provider commitments, bottleneck fixes and operational staffing can require substantial work. A million-user claim cannot honestly rest on a few settings or a diagram.

For the 10k scenario, begin with measured browse-heavy traffic, public CDN caching, safe cache invalidation and bounded dynamic requests. Add replicas or shared state only where the measured workload requires them. Exercise cold caches, hot products, bursts, account traffic and cart mutations separately.

For the 100k scenario, assess independent failure domains, load balancing, durable shared state, queue throughput, database access patterns, upstream API budgets, egress and external monitoring. Two containers on the same host are useful software tests, but are not independent-host redundancy.

For the 1M+ scenario, define distributed edge/origin delivery and regional or failover needs from measurements. Coordinate commerce-provider constraints, buyer identification, checkout throttling, bot behavior and data consistency. Introduce partitioning only for a demonstrated bottleneck. Shopify buyer traffic behavior must not be interpreted as unlimited automated traffic, account operations or checkout creation. [12]

Illustrative workload math: if one million active sessions average one application request every 30 seconds, edge application traffic is about 33,333 requests/second. If 5% is dynamic and 99% of the remaining public traffic is cached, origin application traffic is roughly 1,983 requests/second. A cold public cache can move it toward 33,333 requests/second. This example excludes separate asset and background-job traffic; it is neither a benchmark nor a server-sizing recommendation.

Validation must report workload mix, arrival/session model, duration, regions, hardware, cache state, payload/egress, p50/p95/p99 latency, errors, attempted/completed/dropped work and generator saturation. Controlled dependency failures, queue saturation, duplicate events and replica loss need separate tests. Load generators must obey approved targets, limits, provider policies and spending caps; the vision does not authorize flooding Shopify or a shared server.

Current position: the workload contract and scaling roadmap are documented; the distributed runtime, executable load profiles and capacity claims remain unverified. Local Docker is available and was used for this release. Kubernetes is an optional future validation tool, not proof of scale or a requirement imposed before a measured need.

Capacity model published 24 September 2026: with the illustrative assumptions above, origin traffic is about 20, 198 and 1,983 requests per second for 10k, 100k and 1M active sessions with a warm cache, and about 333, 3,333 and 33,333 with a cold cache (double that during a 2× burst). Checkout creation, payments and Shopify Functions run on Shopify infrastructure. Provider limits used in the model — Shopify Storefront, Admin and Functions APIs; Cloudflare Workers and D1 — were checked against official documentation on that date. No load test at these volumes has been run.

## 10. Reliability, monitoring and recovery

The availability objective, raised on 24 September 2026, is a 99.9% target with 99% as the minimum floor, for each defined core journey and serving region over a rolling 30-day window. A complete 30-day window contains 43,200 minutes: the 99.9% target allows about 43 minutes of downtime, and the 99% floor allows 432 minutes, or 7 hours 12 minutes. This is an engineering objective, not a contractual SLA or a currently observed result.

Error-budget policy: while more than half of the monthly budget remains, releases proceed normally; with 25–50% remaining, each release needs a reviewed rollback plan; below 25%, only reliability and security fixes ship; once the budget is exhausted or availability falls below the 99% floor, releases freeze and reliability work takes priority until recovered. Reaching 99.9% requires at least two independent origin instances behind a health-checked load balancer; the current single-host static release is not expected to meet the target.

Monitoring must distinguish a homepage response from a working product, account or checkout journey. Planned external US/EU probes need explicit intervals, deadlines and expected responses. Missing telemetry is unknown, not successful uptime. Count customer-visible maintenance and dependency failures while recording their causes separately. Sandbox checkout probes must not charge real cards.

Operational telemetry is planned for latency, errors, resource saturation, queue age, failed jobs, API throttling, webhook processing and backup/certificate health. Logs and traces must use redaction and bounded retention/cardinality. Dashboards require appropriate access control; alert delivery and escalation ownership must be tested. No staffed 24/7 on-call service is claimed.

The current static release has a tested off-server artifact backup and byte-verified restore; a rollback drill to a previous release has not yet been run. Future persistent commerce/app data requires application-consistent backups, access protection, retention, recovery drills and measured recovery point/time objectives. A container restart cannot recover a failed host; a monitor or sole backup on that same host does not provide independent protection.

Release and incident playbooks should cover dependency outage, bad deployment, compromised credentials, queue backlog, data restoration and rollback/migration compatibility. Error-budget consumption should influence release decisions. Actual achievement of the 99.9% target or the 99% floor can be reported only after the agreed observation window and journey coverage exist.

## 11. Delivery plan and acceptance milestones

The current master plan has six delivery phases, A–F, with production-readiness and scalability workstreams running across them. It contains 61 task contracts of unequal size. The task count is not a completion percentage. The owner has accepted the selected visual direction and authorized its live review; the broader integration remains paused until the next implementation instruction.

Phase A — Preserve and accept the frontend. Retain the chosen design, original asset provenance, accessible fallbacks and visual regression evidence. The bounded public visual-review milestone is delivered; later requested visual changes still require their own review.

Phase B — Foundation and genuine Shopify storefront. Complete dependency/configuration work, prove the Node/Hydrogen runtime, integrate the chosen presentation, connect catalog/cart/accounts and validate sandbox checkout. Exit with real SSR and buyer-isolation evidence, not fixture-only success.

Phase C — Merchant application and Shopify Functions. Repair install/authentication, protected token storage, tenant separation, environment isolation, review/publishing workflows, webhooks and native Function validation. Exit with authenticated merchant journeys, recovery evidence and actual eligible sandbox enforcement.

Phase D — Approved commercial capabilities. Implement the chosen B2B, markets/localization, subscriptions, checkout extensions, account utilities and specified partnership workflows. Feature eligibility, merchant decisions and grants are prerequisites; unsupported behavior must remain explicitly blocked.

Phase E — Recommendations and data. Establish privacy-approved inputs and deterministic ranking first, then evaluate any AI/retrieval provider, bounded budgets, grounded output, catalog allowlists, injection resistance and failure fallback. Add reporting infrastructure only where justified. Recommendations remain discovery assistance, not clinical advice.

Phase F — Integrated release and handoff. Tie CI to the actual candidate artifact, complete applicable production/scale gates, validate staging, prepare rollback and recovery, deploy with drift checks, prove public behavior and parity, and deliver operations and client evidence. The static frontend release completes only its own subset of this phase.

Workstream P — Legal applicability; application security; privacy; honest product/commerce content; accessibility; SEO/agent visibility; performance; observability; reliability; and an evidence index linking each claim to source, tests, results and limitations.

Workstream S — Workload definition; portable runtime/state boundaries; bounded dependencies and durable jobs; executable load tests; local multi-instance/recovery proof; a costed scaling decision register; and separately authorized distributed validation at increasing tiers.

The next implementation priority is to finish the runtime and selected-design integration, resolve development-store publication access, then connect catalog and cart before expanding features. Dates and fixed delivery promises should be set after the remaining scope, access and acceptance dependencies are confirmed.

## 12. Cost model and longer-term vision

The baseline favors existing infrastructure, local tools and suitable open-source or free-tier components. The current release reused existing hosting; it did not purchase a new server or domain. Existing hosting itself has an ongoing cost. Free tools do not eliminate bandwidth, storage, provider usage, specialist review or operator time.

Growth decisions need a dated bill of materials: measured trigger, selected service, configuration or code affected, migration/recovery work, unit cost, provider limits and approval. Likely paid areas include independent compute, balancing/failover, durable shared storage/queues, external monitoring, log retention, backup storage, egress, distributed test generation and legal/security reviews. Optional image/video/AI usage and premium Shopify capabilities need separate budget decisions; no current price quote or unlimited free scale is promised.

The longer-term product vision includes a richer recovery catalog, additional markets and languages, mobile experiences, supported wearable integrations, progress-oriented interfaces, white-label tenancy and partner workflows. Earlier ideas involving biomarker data, supplements, women's health, camera-based posture features or telehealth are exploratory directions rather than delivered modules or committed near-term scope. They require distinct privacy, evidence, product-safety, licensing and clinical/regulatory assessment before adoption.

The intended client value is a distinctive frontend backed by inspectable engineering: a clear delivery status, maintainable boundaries, measured quality, a defensible growth plan and honest limits. Success is demonstrated through working customer and merchant journeys and retained evidence, not the number of services or technologies listed.

## 13. Public documentation on GitHub

On 24 September 2026 a public engineering documentation set was added to the project repository. It is currently on the build/b02-foundation branch, submitted to the main branch as [draft pull request #19](https://github.com/Zahidulislam2222/regenai/pull/19), which remains a draft until the full-workspace build gates pass. Each document labels items as live, built, partial, planned or not measured, and none of them is a certification.

[Architecture](https://github.com/Zahidulislam2222/regenai/blob/build/b02-foundation/docs/ARCHITECTURE.md) — components, frontend/backend split, trust boundaries, hosting and repository map.

[Scalability](https://github.com/Zahidulislam2222/regenai/blob/build/b02-foundation/docs/SCALABILITY.md) — capacity model and tier-by-tier path from 10k to 1M+ concurrent users, using provider limits checked against official Shopify and Cloudflare documentation.

[Reliability](https://github.com/Zahidulislam2222/regenai/blob/build/b02-foundation/docs/RELIABILITY.md) — 99.9% availability target with 99% floor, journey-level indicators, error-budget policy, backup and disaster-recovery objectives, incident response and observability.

[Security model and security policy](https://github.com/Zahidulislam2222/regenai/blob/build/b02-foundation/docs/SECURITY-MODEL.md) — threat model, verified controls, nine openly tracked gaps (SEC-01 to SEC-09) and how to report a vulnerability privately.

[Privacy](https://github.com/Zahidulislam2222/regenai/blob/build/b02-foundation/docs/PRIVACY.md) — live-demo privacy notice (no personal data collected; demo bag stored only in the browser) and the planned data map for the full platform.

[Compliance](https://github.com/Zahidulislam2222/regenai/blob/build/b02-foundation/docs/COMPLIANCE.md) — overview of PCI DSS, GDPR, US state privacy, consumer-health data, health-product claims, consumer protection and accessibility obligations for a real launch; not legal advice.

[Accessibility](https://github.com/Zahidulislam2222/regenai/blob/build/b02-foundation/docs/ACCESSIBILITY.md) — WCAG 2.2 AA engineering target, tested scope and known limitations.

[Package guides](https://github.com/Zahidulislam2222/regenai/tree/build/b02-foundation) — updated READMEs for the storefront, design system, merchant application, the four Shopify Functions and the frontend deployment, plus contributing guidelines, a code of conduct and issue/pull-request templates.

## 14. Primary references

These sources support the planned review framework; they do not certify this project or replace merchant-specific advice. Recheck applicability when products, markets, data use or platform capabilities change.

[1] [EU General Data Protection Regulation](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
[2] [California Department of Justice, CCPA](https://www.oag.ca.gov/privacy/ccpa)
[3] [Washington Attorney General, consumer health privacy](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy)
[4] [FTC health privacy guidance](https://www.ftc.gov/business-guidance/privacy-security/health-privacy)
[5] [FTC Health Products Compliance Guidance](https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance)
[6] [FDA product/device determination](https://www.fda.gov/medical-devices/classify-your-medical-device/how-determine-if-your-product-medical-device)
[7] [European Commission, Consumer Rights Directive](https://commission.europa.eu/law/law-topic/consumer-protection-law/consumer-contract-law/consumer-rights-directive_en)
[8] [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
[9] [European Commission, European Accessibility Act](https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en)
[10] [Google web.dev, Web Vitals](https://web.dev/articles/vitals)
[11] [Google Search Central, AI features and websites](https://developers.google.com/search/docs/appearance/ai-features)
[12] [Shopify API limits](https://shopify.dev/docs/api/usage/limits)

[13] [Shopify Functions API and resource limits](https://shopify.dev/docs/api/functions/latest)

[14] [Cloudflare Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/)

[15] [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

[16] [Google SRE Workbook, implementing SLOs](https://sre.google/workbook/implementing-slos/)
