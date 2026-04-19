# RegenAI — Master Build Plan (v2 Phase-3 depth, end-to-end)

**Project:** RegenAI — regulated-niche wellness DTC, built as a four-layer Shopify commerce platform
**Positioning:** Staff/principal-tier portfolio project. Beats Kindred Grove on every measurable axis. Demonstrates headless storefront + custom Shopify app + Shopify Functions + real data/ML pipeline + compliance-as-code, all shipped end-to-end across Phase 1 + Phase 2 + Phase 3.
**Target timeline:** 105 days of focused build (Phase 1: 45 days, Phase 2: 30 days, Phase 3: 30 days).
**Budget ceiling:** $0 infrastructure cost. No paid SaaS tier triggers until real customer volume. No Shopify Plus paid plan (uses Partner Plus Dev Store). No custom domain or business registration during build.
**Quality bar:** CTO / agency reviewer spends 60 seconds and thinks *"This person runs a Shopify Plus agency practice."*

---

## 1. Brand concept

**Name:** RegenAI
**One-liner:** *"Science-backed recovery. AI-guided wellness. From injury to everyday resilience — products and protocols built with clinical input and real ML."*
**Mission:** Give every person access to clinically credible, AI-personalized regeneration tools — across physio, sleep, mental wellness, nutrition, and longevity — that used to require a clinic, a specialist, or a $5k device.
**Values:** Evidence, Regeneration, Accessibility, Personalization, Transparency.
**Voice:** Confident, clinical, accessible. Not lifestyle-first. Evidence-first.
**Reference brands:** Therabody, Hyperice, Oura, Whoop, Lumen, Eight Sleep, Bioniq, Elvie, Apollo Neuro, Function Health.
**Visual direction:** Clean clinical base (white / bone) + primary trust blue + energetic accent (warm orange or sage green). Type: modern geometric sans (Inter / Satoshi). No heritage serifs.

---

## 2. Product catalog — three phases

### Phase 1 catalog (Year 1 launch: physiotherapy & recovery, 10–12 launch SKUs → 25 by month 6)

1. Smart posture corrector + paired BLE sensor
2. Adjustable back brace
3. Rehab resistance-band kit (5 tensions)
4. Percussion massage gun (3 heads)
5. TENS/EMS dual-mode unit (FDA class II, clearance referenced)
6. Foam roller + mobility set
7. Kinesiology tape 3-pack (subscription candidate)
8. Cold/heat compression wrap
9. Recovery tracker (HRV + SpO2 + sleep, BLE + app-paired)
10. Smart scale with body composition
11. Wearable pain-relief device
12. "Reset Kit" bundle — posture corrector + tape + compression wrap + 8-week protocol

### Phase 2 catalog (Year 2 expansion: sleep + mental + stress + smart fitness + meditation, +40 SKUs → ~50 active)

*Sleep:* sleep-stage tracker ring, weighted blanket set, smart sleep mask (light therapy + sunrise), white-noise device + sleep-sound library, smart pillow with HRV sensor.

*Mental wellness:* vagus-nerve stimulator, HRV biofeedback trainer, mood-tracking wearable, stress-detection watchband.

*Stress relief:* breathwork trainer device, portable cold-immersion tub, app-controlled aromatherapy diffuser.

*Smart fitness:* strain band, continuous temperature ring, smart gym bag (accelerometer-based rep counter).

*Meditation:* neurofeedback headband, tactile meditation device, guided-meditation companion (bundled with mobile app).

### Phase 3 catalog (Year 3+ full wellness: nutrition + AI monitoring + home gym + women's health + anti-aging, +100+ SKUs → ~150 active)

*Nutrition & supplements (DSHEA-compliant):* magnesium glycinate, omega-3, collagen, ashwagandha, creatine, vitamin D, zinc, L-theanine, personalized stacks (subscription), protein blends, greens powders, electrolytes.

*AI health monitoring:* continuous glucose monitors (non-diabetic wellness, partner-sourced), HRV / temperature / blood-oxygen smart rings, at-home biomarker test kits (partner: Function Health / InsideTracker), smart cuff BP monitor.

*Home gym smart equipment:* smart mirror, connected resistance cables, smart cycling bike, AI-coach camera pods.

*Women's health:* pelvic-floor trainer, menstrual tracker + cup, postpartum recovery kits, PCOS-targeted supplement stack, menopause relief.

*Anti-aging / longevity:* red-light therapy panels, NAD+ precursor supplements, biological-age testing partnership, DSHEA-compliant peptide-support supplements, collagen-regeneration devices (microcurrent, radio-frequency).

---

## 3. Positioning

**Hero messaging (do NOT lead with medical device claims):**
Above fold: *"Recover. Regenerate. Reset. Science-backed tools for everyday wellness."*
Trust signals: Clinician-reviewed • AI-personalized • Research-referenced • Third-party tested • Contraindication-aware.

**Target audiences (6 segments across 3 phases):**
1. Physiotherapy patients (home recovery)
2. Athletes & fitness enthusiasts (recovery tooling)
3. Office workers (back/posture/ergonomics)
4. Chronic pain / elderly (ongoing management)
5. Clinics & PTs (B2B bulk orders)
6. Phase 2/3 expansions: sleep seekers, stress-management cohort, longevity enthusiasts, women's-health cohort

**Competitive reference brands:** Therabody, Hyperice, Oura, Whoop, Lumen, Eight Sleep, Bioniq, Elvie, Apollo Neuro, Function Health, Tonal.

---

## 4. Tech stack — 100% free-tier path

### Core architecture (four layers)

| Layer | What lives here | Tech | Cost |
|---|---|---|---|
| **Storefront** | Public UI, PDP, cart, search, quiz, B2B portal | **Hydrogen (React + Remix + TS)** on Oxygen | Free — OSS + existing Cloudflare account |
| **Custom Shopify App** | Clinician review workflow, protocol engine, FDA claim audit, device sync | **Remix app on Cloudflare Workers + D1** (reused existing Cloudflare account) | Free tier — 100k req/day + 5 GB D1 |
| **Shopify Functions** | Cart validation, B2B pricing, delivery, discounts | **Rust + WASM** (or JS) | Free (runs on Shopify infra) |
| **Data & ML** | Event warehouse, embeddings, recommendations | **RudderStack self-hosted → BigQuery free tier → dbt Core → pgvector on Supabase free tier** | Free |

### Hosting

| Need | Service | Cost |
|---|---|---|
| Shopify storefront | **Partner Plus Development Store** (full Plus features, free forever for dev) | $0 |
| Hydrogen | **Oxygen** (free on Partner dev stores) | $0 |
| Custom Remix app | **Cloudflare Workers + D1** (reused existing Cloudflare account — 100k req/day + 5 GB D1 free) | $0 |
| Edge personalization | **Cloudflare Workers** (same account) | $0 |
| Docs micro-site | **Cloudflare Pages free tier** | $0 |
| Case study site | **Cloudflare Pages free tier** | $0 |
| Community (Phase 2) | **Supabase free tier** (500 MB DB, 50k MAU) | $0 |
| Data warehouse | **BigQuery free tier** (10 GB + 1 TB queries/mo) | $0 |
| Vector DB | **pgvector on Supabase** | $0 |

### Observability (all free tiers)

| Need | Service | Free tier |
|---|---|---|
| Error tracking | **Sentry** (reused `zahidul-islam-71` org) | 5k errors/mo, 4 projects scoped |
| RUM | **Sentry Performance** + **Web Vitals** via Hydrogen analytics | Built-in |
| Tracing | **OpenTelemetry** via Sentry distributed tracing (single vendor, one trace ID across layers) | Included in Sentry |
| Logs | **Cloudflare Workers Logs** (Workers + D1 custom app logs) + Sentry breadcrumbs | Free in CF |
| Synthetic checks | **Cloudflare Worker cron** hitting checkout + quiz + PDP every 10 min + failing via Sentry alert | Free in CF |
| Uptime | **UptimeRobot** free | 50 monitors |

### Testing (all free)

| Need | Service | Free |
|---|---|---|
| E2E | **Playwright** | OSS |
| Unit + component | **Vitest** | OSS |
| Component stories | **Storybook** (deployed to GitHub Pages from the repo) | OSS |
| Visual regression | **Percy** — reused from Kindred Grove account (token `web_e510a3a1…`) | Free tier (5k snapshots/mo) |
| Load | **k6** | OSS |
| A11y | **axe-core via Playwright + Storybook a11y addon** | OSS |
| Contract | **GraphQL Code Generator + Vitest** | OSS |

### Security (all free)

| Need | Service |
|---|---|
| SAST | **CodeQL** (free on public repos) |
| DAST | **OWASP ZAP** (OSS) |
| SBOM | **Syft** + **CycloneDX** (OSS) |
| Secret scanning | **gitleaks** (OSS) |
| Signed commits | **gitsign (Sigstore)** (OSS) |
| Dependency audit | **Dependabot** (free on GitHub) |
| Container/image scanning | **Trivy** (OSS) |

### Feature flags & A/B

**Phase 1: localStorage-backed flag system** (same pattern as Kindred Grove — zero-signup, URL-override, exposure analytics event). Covers the Phase 1 demo.

**Phase 2 (Day 42+): Statsig free tier** (1M events/mo) — real A/B infrastructure + exposure logging + warehouse-connected. **Statsig signup deferred until Phase 2** (not blocker for Phase 1).

### CMS

**Sanity free tier** (3 users, 10k documents, 1M API calls/mo) — for 200+ clinical articles, editorial team ergonomics.

### Email & transactional

**Resend free tier** (3k emails/mo) + **Klaviyo free tier** (≤250 contacts) for marketing.

### AI tooling — the Anderson Collaborative skill tags

| Tool | Role | Cost |
|---|---|---|
| Claude Code (Max plan) | Primary dev agent | Already have |
| Shopify Dev MCP | Shopify-specific knowledge | Free |
| **Cursor Pro** | Secondary dev pair — logged in AI-WORKFLOW | $20/mo (tool sub, excluded per user) |
| **GitHub Copilot** | Inline React component generation | Free tier (2k completions/mo) |
| **Codex (ChatGPT)** | Schema queries, refactor spikes | Free tier or Plus (excluded per user) |
| Claude Design | Brand system + component prototyping | Already have |

### Design & visual stack

| Layer | Tool | Role | Cost |
|---|---|---|---|
| **Brand generation** | **Claude Design** | Day 1 generates full brand system: color tokens, type pair, spacing scale, motion, radii, shadow scale. Export → Tailwind config + `@regenai/ui` tokens. | Free (Max plan) |
| **Component primitives** | **shadcn/ui** | Radix-based accessible primitives (Dialog, Dropdown, Tabs, Accordion, Toast, Popover, Select, etc.). Copy-own-the-code pattern — not a dependency. | Free (OSS) |
| **Styling engine** | **Tailwind CSS** | Design tokens + utility classes. Custom plugin for brand tokens. | Free (OSS) |
| **Complex one-offs** | **v0 by Vercel** | Interactive hero, body-area SVG selector, quiz flow, PDP galleries — when Claude Design + hand-code is slower | Free tier |
| **Micro-interactions** | **Framer Motion** | Page transitions, card hover, drawer slide, scroll-triggered reveals. Respects `prefers-reduced-motion`. | Free (OSS) |
| **Icon system** | **Lucide** | React-native, tree-shakeable, 1,400+ icons | Free (OSS) |
| **Typography loading** | **Fontsource** | Self-hosted Inter + Satoshi (no Google Fonts CDN — privacy + perf) | Free (OSS) |
| **Storybook** | Component docs + preview | Static build deployed to GitHub Pages (free) | Free |
| **Percy** | Visual regression on page-level + key component pages | 5k snapshots/mo — reused from KG account | Free tier |

### Visual direction (proposed — validate via Claude Design session Day 1)

**Color tokens (initial proposal):**
- `--color-bone` — off-white base `#F8F6F1`
- `--color-primary` — deep clinical blue `#1E3A5F`
- `--color-primary-hover` — lighter blue `#2E5280`
- `--color-accent` — warm terracotta `#C87A4B` (energetic, not loud)
- `--color-sage` — muted green `#7A8F6F` (for wellness/trust-layer emphasis)
- `--color-ink` — charcoal text `#1A1A1A`
- `--color-muted` — secondary text `#5A5A5A`
- `--color-success` `#2D7A4F` / `--color-warning` `#C47E2A` / `--color-error` `#B23A3A` / `--color-info` `#1E3A5F`
- All contrast-verified ≥ 4.5:1 on bone background (WCAG 2.2 AA)

**Type pair:**
- Display: **Satoshi** (modern geometric sans) — headings, hero, product titles
- Body: **Inter** (highly readable, ubiquitous) — prose, UI, forms
- Mono: **Geist Mono** — code, serial numbers, protocol step counters
- Arabic fallback: **IBM Plex Sans Arabic** (under `[dir="rtl"]`)

**Spacing / radii / motion:**
- Base spacing unit: 4px (Tailwind default scale)
- Radii scale: 4 / 8 / 12 / 16 / 9999 (friendly, not playful)
- Motion base: 150ms ease-out default; 250ms for drawers; respect `prefers-reduced-motion`
- Shadow scale: 4 elevation levels (subtle, layered, no heavy drop-shadows)

**Reference vibe:** Therabody × Oura × Lumen — clinical, confident, product-photography-forward, evidence-first. NOT lifestyle-fluffy, NOT playful-consumer.

**Total infrastructure monthly cost: $0.** All tool subscriptions are personal AI subs, excluded per user direction.

---

## 5. Pages / routes scope — 48 templates across 3 phases

### Phase 1 — 22 templates
1. Home
2. Collection (PLP) with body-area + condition filters
3. PDP — gallery, variant picker, subscription, clinical protocol, FAQ, contraindications, study references
4. Cart drawer + full cart page
5. Predictive search
6. **Body-area interactive selector** (SVG Web Component)
7. **Recovery quiz** (multi-step Web Component)
8. Protocol detail page (metaobject-driven)
9. Clinician bio pages (metaobject-driven)
10. Clinical content library (Sanity-powered)
11. Article / blog template
12. B2B clinic portal (bulk order, net-30, approval chain)
13. B2B company / location / price-list pages
14. Affiliate partner dashboard
15. Appointment / consult scheduling
16. Device-pairing flow
17. Subscription management
18. Customer account (login, register, dashboard, orders, addresses, password reset, activation)
19. Gift / bundle collection
20. Checkout (with 6 extensions + payment customization Function)
21. Styleguide (pulled from `@regenai/ui` Storybook)
22. 404 + policies + Shopify-native policy pages

### Phase 2 — +10 templates
23. Sleep dashboard (sleep-stage + HRV history)
24. Mental wellness hub
25. Mobile device-pairing (multi-device BLE flow)
26. Community home
27. Community thread detail
28. Cohort page (insomnia, anxiety, athletic recovery, chronic pain)
29. Subscription billing history
30. Protocol tracker (8-week adherence)
31. Push notification preferences
32. Cross-device sync status

### Phase 3 — +16 templates
33. Telehealth consult entry (Ro / Hims-partner integration)
34. Biomarker dashboard
35. Supplement stack builder (personalized)
36. Women's health hub
37. Postpartum recovery track
38. PCOS / menopause track
39. Longevity protocol builder
40. Biological-age results
41. Retail locator (Shopify POS)
42. White-label partner admin (multi-tenant SaaS)
43. Smart gym pairing + telemetry
44. Cohort outcomes dashboard
45. Anti-aging product hub
46. Peptide / supplement safety reference
47. Lab-result upload + interpretation
48. International market selector

---

## 6. Custom features

### Phase 1 features
- Build Your Recovery Quiz (multi-step → customer metafield → protocol recommendation via ML)
- Custom subscription engine (Selling Plans + Subscription Contracts, not Recharge)
- Body-area storytelling (metaobject-driven interactive SVG)
- Wholesale / B2B inquiry → Admin API draft order + human approval routing
- Predictive search (GraphQL, debounced, cross-type: products + protocols + articles)
- Cart drawer with free-ship bar + upsell
- Quick view modal
- Gift flow (note + scheduled delivery)
- Recently viewed (localStorage)
- Low-stock urgency (FDA class II handling for restricted devices)
- Exit-intent email capture
- **Feature flag system** — Statsig-backed, not localStorage
- **WebBluetooth posture-sensor pairing demo** on PDP
- **Symptom → protocol AI engine** (real pgvector embeddings + Claude API)
- **Contraindication cart validator** (Shopify Function, Rust/WASM — blocks pacemaker + TENS combination at checkout)
- **Clinician approval workflow** — custom app routes any PDP health-claim edit to clinician review before merge
- **Protocol adherence tracker** (8-week, push notifications via custom app)
- **Full B2B Plus setup** — companies, locations, price lists, net-30, approval chains, tax-exempt
- **Shopify Markets** — 5 markets (US, CA, UK, EU, AU) with market-specific catalogs (FDA vs CE segmentation)

### Phase 2 features
- React Native / Expo mobile app (iOS + Android)
- Multi-device BLE pairing (posture + sleep + HRV)
- Apple HealthKit + Google Fit OAuth integration
- Push notification engine (OneSignal)
- Community platform (threads, posts, moderation)
- OpenAI Moderation API + human-review queue
- Crisis flagging (suicide/self-harm detection policy)
- Cross-vertical ML v2 (cohort recommendations: bought posture sensor → suggest stress protocol)
- Sleep-stage ingestion pipeline
- Mental-wellness content library (200+ articles)
- Cohort segmentation dashboard

### Phase 3 features
- Telehealth partner integration (scope-of-practice mapping)
- Biomarker lab result ingestion (Quest / Labcorp / InsideTracker / Function Health)
- Personalized supplement stack builder (ML v3 causal inference)
- Supplement subscription cadence engine (custom, not Recharge / Stay.ai)
- Smart gym IoT pipeline (device registration, firmware OTA, telemetry)
- Multi-tenant B2B SaaS admin (clinics license recommendation engine as white-label)
- Physical retail integration (Shopify POS)
- International 3PL routing (mocked multi-3PL ADR)
- Women's health data residency (state-by-state routing post-Dobbs)
- Age gating (hardware-backed session + cookie for restricted products)
- Clinical-claim review workflow (pharmacist + clinician dual-sign for biomarker-linked products)

---

## 7. Data architecture

### Metaobjects — 24 total across phases

**Phase 1 (10):**
- `BodyArea` (neck, shoulders, back, knees, hips, ankles, wrists, core) + icon + SVG mask coords
- `Condition` (posture, chronic pain, sports recovery, sleep, stress, arthritis, injury-recovery)
- `Protocol` (multi-step treatment, linked products, duration, video)
- `Clinician` (name, credentials, photo, bio, linked products)
- `Certification` (FDA cleared, ISO, CE, research-backed, third-party tested)
- `StudyReference` (PMID, journal, year, study design, linked claim)
- `DeviceModel` (SKU, BLE profile, firmware version, pairing instructions)
- `DeliveryZone` (tax rules, market, 3PL routing)
- `SubscriptionPlan` (cadence, discount, cancel policy)
- `AffiliatePartner` (tier, commission rate, payout method)

**Phase 2 additions (6):**
- `SleepArchetype` (insomniac, light sleeper, shift worker, athlete, postpartum)
- `MentalWellnessTrack` (anxiety, depression, burnout, sleep-anxiety)
- `Cohort` (segmentation attributes)
- `CommunityChannel` (name, moderators, rules, cohort-linked)
- `PushCampaign` (trigger, cadence, content ref)
- `MobileDevice` (platform, app version, pairing state)

**Phase 3 additions (8):**
- `BiomarkerPanel` (lab partner, biomarkers tested, reference ranges)
- `SupplementStack` (ingredients, doses, timing, contraindications)
- `TelehealthPartner` (scope, states licensed, integration endpoint)
- `WomensHealthTopic` (with data-residency constraints)
- `LongevityProtocol` (peptide-free, DSHEA-compliant)
- `RetailLocation` (address, staff, inventory sync policy)
- `WhiteLabelTenant` (branding config, isolation policy, SLA tier)
- `AgeGate` (products requiring 18+ / 21+ / clinician-verified access)

### Product metafields

- `body_areas` (list → BodyArea)
- `conditions` (list → Condition)
- `evidence_level` (A/B/C/D)
- `fda_class` (class I/II/III/N-A)
- `clinician_review` (→ Clinician)
- `linked_protocol` (→ Protocol)
- `contraindications` (rich text)
- `ingredients` (rich text with allergen flags)
- `third_party_test_results` (file attachment)
- `shipping_restrictions` (per-market rules)

---

## 8. Professional layer (quality bar)

### Performance — Lighthouse 95+ across all four
- Hydrogen SSR + streaming, React Server Components
- Route-level caching (s-maxage + stale-while-revalidate)
- Image optimization (Hydrogen `Image` component + AVIF/WebP)
- Edge-rendered above-fold (Cloudflare Workers)
- Font preload + subset
- Code splitting per route
- Lighthouse CI with tight budgets in `budget.json`
- Target: LCP <1.8s, CLS <0.05, INP <150ms

### Accessibility — WCAG 2.2 AA (not 2.1)
- Semantic HTML + landmarks + skip links
- ARIA labels + live regions
- Keyboard navigation + visible focus
- Color contrast ≥ 4.5:1 (tokens enforced)
- Target-size ≥ 24px (2.2 criterion)
- Focus-appearance criterion
- Dragging-movements criterion
- Screen reader tested (VoiceOver + NVDA + JAWS)
- axe-core via Playwright in CI on every PR
- Storybook a11y addon on every component
- Manual keyboard walkthrough on every major flow

### SEO
- JSON-LD schemas × 10: Product, Organization, FAQ, Breadcrumb, Review, AggregateRating, Article, Recipe, HowTo, MedicalWebPage, Service, LocalBusiness, VideoObject
- Meta + Open Graph + Twitter cards per route
- Sitemap + robots.txt
- Canonical URLs
- `hreflang` for 5 locales
- Rich Results test clean across all schemas

### Internationalization
- 5 locales: EN (default), ES (US Spanish), FR (EU), DE (EU), AR (MENA, RTL)
- Multi-currency: USD + CAD + GBP + EUR + AUD
- `hreflang` correctly set per locale + market
- RTL CSS for Arabic (logical properties throughout)
- CLDR-correct plurals
- Market-specific catalogs (FDA vs CE-marked SKUs segmented via Markets)

### Security
- CSP via Remix `headers()` export (cleaner than `<meta>`)
- All user input `| escape` / React auto-escaped + sanitized at form boundary
- Rate limiting on all public forms (Cloudflare Worker middleware + custom app throttle)
- No secrets in repo (gitleaks + CodeQL + signed commits)
- Dependabot weekly
- SBOM generated per build (CycloneDX)
- SLSA provenance on releases
- OWASP ZAP DAST in CI
- Signed commits via gitsign

### Observability
- **OpenTelemetry end-to-end** — one trace ID spans browser → Hydrogen loader → custom app → Shopify GraphQL → Function execution
- **SLOs defined in YAML**: checkout success 99.5%, search p95 <300ms, LCP p75 <2s
- **Error budgets** — deploy blocked if weekly burn > 50%
- **Sentry** for errors (browser + Hydrogen + Remix app + mobile in Phase 2)
- **Sentry Performance + Web Vitals** for RUM (single-vendor with errors + tracing)
- **Cloudflare Worker cron** synthetic checks every 10 min on checkout + quiz + PDP + ML endpoint → Sentry alert on failure
- **Shopify customer events** (add_to_cart, begin_checkout, purchase) via Hydrogen analytics
- **Custom events**: quiz_complete, body_area_selected, protocol_started, b2b_inquiry, device_paired, protocol_adherence, supplement_stack_built, biomarker_uploaded, clinician_review_submitted

### Testing
- **Playwright E2E** — 10 golden-path tests covering all critical flows
- **Vitest unit + component** tests — ≥70% coverage on `app/` and `@regenai/ui`
- **Storybook** for component docs + **Percy** visual regression on page + key-component routes (per PR)
- **Percy** visual regression on every storefront PR
- **k6** load tests on quiz + ML recommendation endpoint
- **Contract tests** against Storefront GraphQL schema (generated types)
- **Chaos tests** — flaky-network simulation
- **theme-check** n/a (no Liquid); replaced by ESLint + TypeScript + Prettier

### AI workflow (differentiator)
- **Shopify Dev MCP** connected to Claude Code
- **Cursor** for React component spikes (logged in AI-WORKFLOW.md)
- **GitHub Copilot** for inline React generation (logged)
- **Codex (ChatGPT)** for schema queries and refactor spikes (logged)
- Every AI-assisted commit labeled with trailer
- `AI-WORKFLOW.md` — prompts library, velocity log, before/after per tool
- `AI_GOVERNANCE.md` — multi-assistant honest framing, tool-by-tool scope, human review boundary
- Case study site draws from real prompt + velocity evidence, not claims

### Compliance-as-code
- **FDA claim lint** — CI checks PRs touching product copy; flags unsupported claims via regex + LLM-assisted review; merge blocked unless `StudyReference` metaobject linked
- **DSHEA disclaimer validator** — every supplement product page must embed DSHEA disclaimer snippet; CI asserts presence
- **Contraindication CI check** — every TENS/EMS / peptide / biomarker-linked product page must render contraindication block
- **Age-gate enforcement test** — Playwright asserts 18+ / 21+ products blocked without verified session
- **Data-residency routing check** — women's-health content routes verify state-based data-minimization policy
- WCAG 2.2 AA enforced via axe
- GDPR + CCPA compliance surface (cookie consent, DSAR endpoint, data-export on account page)
- HIPAA-ready event pipeline — PHI-tagged fields in Segment schema, encryption-at-rest on Snowflake-tier data, audit log retention

---

## 9. CI/CD + branching strategy

### Branches
```
main (production-ready, always deployable)
  ├── staging (pre-prod QA)
  │   └── dev/<feature> (feature branches)
```

### Environments
- `dev` — Oxygen preview URL per PR + custom-app Cloudflare Workers preview deployment per PR (via Wrangler `--env preview`)
- `staging` — full stack deployed on merge to `staging`
- `production` — full stack deployed on merge to `main` (manual approval required via GH environment gate)

### GitHub Actions workflows — 15 total

1. `lint.yml` — ESLint + Prettier + TypeScript
2. `test-unit.yml` — Vitest unit + component + coverage report
3. `test-e2e.yml` — Playwright E2E on PR
4. `test-a11y.yml` — axe-core via Playwright
5. `test-visual.yml` — Percy storefront + component-page snapshots
6. `test-contract.yml` — Storefront GraphQL schema contract
7. `test-load.yml` — k6 on quiz + ML endpoint (scheduled nightly)
8. `lighthouse-ci.yml` — performance budget enforcement
9. `sast.yml` — CodeQL on push
10. `dast.yml` — OWASP ZAP on staging deploy
11. `sbom.yml` — Syft + CycloneDX on release
12. `secret-scan.yml` — gitleaks on PR + schedule
13. `compliance-lint.yml` — FDA claim + DSHEA + contraindication lint
14. `deploy-preview.yml` — Oxygen preview URL + Cloudflare Workers ephemeral app per PR
15. `deploy-staging.yml` — push to `staging` branch
16. `deploy-production.yml` — push to `main` + manual approval + error-budget gate (deploy blocked if Sentry SLO burn >50%)

*Total: 16 files. Count says "15 total" historically — kept at 16 because production deploy is split across a reusable workflow. CI-workflow count in this plan is reported as **16 green** in final deliverables.*

### Branch protection (main)
- Require PR + 1 approval (self-review OK for solo)
- Require all CI checks pass
- Require branches up-to-date
- Require signed commits (gitsign)
- Linear history
- No force push

---

## 10. Documentation bundle — 22 docs + 20 ADRs + Starlight micro-site

### Docs in `/docs/`
- `README.md` — setup, quickstart, overview
- `ARCHITECTURE.md` — 4-layer architecture, folder structure, C4 diagrams
- `CONTRIBUTING.md` — dev onboarding, commit format, PR process
- `AI-WORKFLOW.md` — prompts library, velocity log, before/after per AI tool
- `AI_GOVERNANCE.md` — multi-assistant scope, tool roles, review boundary
- `PERFORMANCE.md` — budgets, optimization log, LCP/CLS/INP strategy
- `ACCESSIBILITY.md` — WCAG 2.2 AA posture, contrast tables, a11y test log
- `SECURITY.md` — threat model, CSP, rate limiting, SBOM policy
- `TESTING.md` — test strategy across Vitest + Playwright + Percy + Storybook + k6 + contract + chaos
- `CHANGELOG.md` — version history
- `ROADMAP.md` — Phase 2 + Phase 3 feature map with gate criteria
- `MERCHANT-GUIDE.md` — Admin + metaobject + CMS + B2B + Markets operations
- `COMPLIANCE.md` — FDA / DSHEA / WCAG 2.2 / GDPR / CCPA / HIPAA-ready posture
- `DATA-MODEL.md` — metaobjects + metafields + warehouse schema + events
- `RUNBOOK.md` — incident response, rollback, data-loss recovery
- `API-SPEC.md` — OpenAPI 3 for custom Remix app endpoints
- `ML-PIPELINE.md` — embedding strategy, vector search, recommendation flow
- `SLO.md` — SLO definitions, burn-rate alerts, error-budget policy
- `DESIGN-TOKENS.md` — token system, theming, brand variables
- `B2B-GUIDE.md` — Plus B2B onboarding for clinics
- `MARKETS-GUIDE.md` — market-specific catalog + tax + compliance
- `MOBILE-GUIDE.md` (Phase 2) — mobile app architecture + pairing + deep-linking

### ADRs in `/docs/adr/` — 20 total

1. Why Hydrogen over Liquid themes
2. Why TypeScript + Tailwind CSS
3. Why Remix file-based routing
4. Why Oxygen hosting (+ Cloudflare Pages fallback)
5. Why the design system is a published npm package
6. Why Shopify Dev MCP + multi-assistant (Cursor + Copilot + Codex)
7. Why Playwright + Vitest + Percy + Storybook (testing stack — single visual-regression vendor)
8. Why Shopify Functions over Scripts / Pixels
9. Why custom subscription engine over Recharge
10. Why Sanity CMS alongside metaobjects
11. Why Segment (RudderStack self-hosted) → BigQuery → dbt
12. Why pgvector over Pinecone / Weaviate
13. Why Claude API for embeddings vs OpenAI
14. Why Statsig over LaunchDarkly / PostHog
15. Why OpenTelemetry over Sentry-only
16. Why compliance-as-code (FDA + DSHEA CI checks)
17. Why WCAG 2.2 AA over 2.1
18. Why Shopify Markets for FDA vs CE segmentation
19. Why Cloudflare Pages for docs + case study + edge middleware
20. Why multi-assistant AI-governance honest framing (vs single-AI)

### Docs micro-site
- **Astro Starlight** deployed to Cloudflare Pages, separate from storefront
- Includes C4 model diagrams (Structurizr or Mermaid), OpenAPI spec viewer, ADR index, searchable

### Design system published
- `@regenai/ui` — scoped npm package, semver-versioned, published to npm
- **Storybook** static build deployed to GitHub Pages (free, no signup)
- Consumed by storefront + custom Remix app + Phase 2 mobile app

---

## 11. 105-day build plan

### PHASE 1 — Days 1–45 (Storefront + Custom App + Functions + B2B + Markets + ML + Compliance)

#### Week 1 — Foundation + CI
**Day 1 — Setup + MCP + multi-AI + Claude Design brand session**
- Shopify Partner account + request Partner Plus Development Store
- Init Hydrogen project with TypeScript + Tailwind (`npx create-hydrogen@latest`)
- Init GitHub public repo with branch protection on `main` + linear history + signed commits
- Install Shopify Dev MCP Server; verify `claude mcp list ✓ Connected`
- Wire Cursor, GitHub Copilot, Codex into workflow; start AI-WORKFLOW.md logging from commit #1
- Oxygen deploy env configured; 3 environments (dev / staging / production)
- Brand brief + SOW + 1-page tone doc in `/docs/BRAND-BRIEF.md`
- **Claude Design session — generate full brand system** from brand brief: color palette, type pair, spacing scale, motion tokens, radii, shadows. Output → `docs/design-system/brand.json` + exported previews. Validate before locking.

**Day 2 — Storefront scaffold + design tokens from Claude Design**
- Hydrogen base layout with semantic HTML
- Tailwind config driven by Day 1 Claude Design brand-system export (tokens → `tailwind.config.ts` + CSS custom properties)
- shadcn/ui initialized (`npx shadcn@latest init`); Radix primitives installed
- Fontsource self-hosted Inter + Satoshi + Geist Mono
- Lucide icon system wired
- Theme provider (light / dark / high-contrast / `prefers-reduced-motion`)
- Remix route skeleton
- ADR-001: Why Hydrogen over Liquid
- ADR-002: Why TypeScript + Tailwind + shadcn/ui (component-ownership model)

**Day 3 — CI pipeline foundation**
- 15 GitHub Actions workflows (see §9)
- Lighthouse CI with `budget.json`
- Playwright + Vitest + axe + Percy setup
- Sentry installed (4 projects under existing `zahidul-islam-71` org — storefront, app, worker, mobile)
- Sentry Performance + Web Vitals for RUM (replaces Honeycomb / Grafana Faro)
- Cloudflare Workers Logs wiring for custom-app observability
- ADR-007: testing stack — Percy over Chromatic (avoid duplicate visual-regression vendors)

**Day 4 — Design system scaffold — `@regenai/ui` package**
- Package scaffold (TS + Tailwind tokens imported from root), Storybook init
- First 15 components — shadcn/ui primitives styled with RegenAI tokens, plus brand-specific additions:
  Button, Input, Select, Checkbox, Radio, Card, Badge, Icon, Dialog, Drawer, Accordion, Tabs, Tooltip, Toast, Popover
- Each component: Storybook story + a11y addon + **Percy page-level baseline** (full pages, not per-component)
- Storybook static build deployed to GitHub Pages (free)
- Framer Motion wrapper components (FadeIn, SlideUp, StaggerChildren)
- Publish v0.1.0 to npm (scoped public — `@regenai/ui`)
- ADR-005: Why design system as published npm package + shadcn/ui ownership model

**Day 5 — Header + Footer + Nav + Styleguide**
- Header with logo, nav, cart, search, language/currency switcher
- Mobile menu drawer
- Footer with newsletter, links, trust badges, social
- Announcement bar (dismissible, CMS-editable)
- Styleguide route pulls from `@regenai/ui` Storybook

**Day 6 — Home page**
- Hero block with streaming SSR
- Trust strip (clinician-reviewed + research-referenced + third-party tested)
- Featured collections
- Clinician quote block (metaobject-driven)
- Newsletter (Klaviyo free tier)
- Values strip
- UGC / content strip

**Day 7 — ADR consolidation + Week 1 tag**
- ADR-003: Remix file-based routing
- ADR-004: Oxygen + Cloudflare Pages fallback
- ADR-006: multi-assistant AI governance
- Tag `v0.1-week1-foundation`

#### Week 2 — Product discovery + cart
**Day 8 — Collection (PLP)**
- `/collections/$handle` route
- Filter system by BodyArea + Condition metaobjects
- Sort dropdown + pagination
- Lazy-loaded product card
- Quick view modal

**Day 9 — PDP part 1**
- `/products/$handle` route
- Gallery with thumbs + main (swipeable on mobile)
- Variant picker with subscription toggle
- ATC via `useOptimisticCart`
- JSON-LD Product + AggregateRating
- Breadcrumbs + meta + OG + Twitter cards

**Day 10 — PDP part 2**
- Clinical protocol section (metaobject-driven)
- Contraindication callout (FDA class II awareness)
- Certifications badges
- Study references footnote (linked StudyReference metaobjects)
- Recipe-analog: "How to use" step-by-step
- FAQ accordion
- Related products / recently viewed (localStorage)
- Reviews integration (Judge.me via Storefront API)
- ADR-010: Sanity alongside metaobjects

**Day 11 — Body-area selector**
- Interactive SVG Web Component
- Click body area → filtered catalog
- Keyboard-navigable + screen-reader described
- Mobile-optimized tap zones (WCAG 2.2 target-size)

**Day 12 — Recovery quiz**
- Multi-step Web Component
- Vanilla state machine
- Writes result to customer metafield via Storefront API
- Recommendation CTA → links to symptom → protocol ML engine
- Analytics event: `quiz_complete`

**Day 13 — Predictive search**
- Storefront API + debounced (250ms)
- Results across products + protocols + articles
- Keyboard navigation + screen-reader live region

**Day 14 — Cart drawer + cart page**
- Slide animation, headless UI
- Free-ship progress bar
- Cart upsell section
- Gift-note field
- No-JS fallback for cart page
- Tag `v0.2-week2-discovery`

#### Week 3 — Custom Remix app + first Functions
**Day 15 — Custom Remix app scaffold on Cloudflare Workers**
- `npx @shopify/create-app@latest` → Remix app targeting **Cloudflare Workers + D1** (reuse existing Cloudflare account; avoids Fly.io signup)
- D1 schema for session store, clinician-review queue, protocol tracker, OAuth tokens
- Admin UI base with Shopify Polaris
- Register app with dev store (Custom / Public mode)
- OAuth + session management via Workers KV
- First admin route: clinician reviewer dashboard
- ADR-009: Why custom subscription engine (setup for Week 4)
- ADR-021: Cloudflare Workers + D1 for custom app (vs Fly.io / Railway)

**Day 16 — Shopify Function 1: Cart contraindication validator**
- Rust + WASM function
- Reads customer metafield (`medical_flags`) + cart items
- Blocks checkout if pacemaker + TENS combo (or similar contraindications)
- Deployed to Shopify via CLI
- ADR-008: Shopify Functions over Scripts

**Day 17 — Shopify Function 2: B2B tiered pricing**
- Applies volume discounts for B2B companies by location
- Tested against B2B staging data

**Day 18 — Shopify Function 3: Delivery customization**
- Hides express shipping for regulated-device SKUs
- Adds signature-required for TENS/EMS

**Day 19 — Shopify Function 4: Discount stacking**
- Allows subscription + first-time + clinic discount stack under rules
- Caps total discount at 40%

**Day 20 — Clinician approval workflow v1**
- Custom app route: claim-review queue
- Product-copy diff display
- Approve / request-change / reject with note
- Linked to GitHub PR via webhook (auto-comments approval status)

**Day 21 — Protocol engine v1**
- Custom app CRUD for Protocol metaobjects
- 8-week adherence tracker data model
- Push trigger scaffolding (Phase 2 activates)
- Tag `v0.3-week3-app-functions`

#### Week 4 — B2B + Markets + Checkout + Subscriptions
**Day 22 — Shopify Plus B2B setup**
- Companies / locations / price lists / payment terms / approval chains
- Clinic onboarding form (frontend) → admin approval → company creation via Admin API
- Tax-exempt flag handling

**Day 23 — Shopify Markets setup**
- 5 markets: US (default), CA, UK, EU, AU
- Market-specific catalogs: US = FDA-cleared SKUs, EU = CE-marked SKUs
- Currency + tax per market
- ADR-018: Markets for FDA vs CE segmentation

**Day 24 — Checkout Extensibility part 1**
- 4 UI extensions: Trust badges, Subscription upsell, Gift message, Delivery instructions
- Each extension: own route, tested in checkout simulator

**Day 25 — Checkout Extensibility part 2**
- Pre-purchase extension (subscription offer)
- Post-purchase extension (download app + protocol link)
- Payment customization Function (hide COD for high-value orders)

**Day 26 — Custom subscription engine**
- Selling Plans API — 4 cadences (weekly, bi-weekly, monthly, quarterly)
- Subscription Contracts — custom controller in Remix app
- Customer-facing self-serve management (pause, skip, swap SKU)
- ADR-009 finalized

**Day 27 — B2B frontend portal**
- B2B-only Hydrogen routes (gated by customer tag + company context)
- Bulk-order templates, reorder, net-30 invoice view

**Day 28 — Affiliate portal scaffold**
- Partner registration
- Unique referral code
- Dashboard with clicks + conversions + payout balance
- Tag `v0.4-week4-plus-features`

#### Week 5 — Data pipeline + ML + Observability
**Day 29 — Data pipeline**
- RudderStack self-hosted (OSS) event collection
- Events → BigQuery free tier
- Product / Order / Customer / Event tables
- dbt Core project with staging + mart models

**Day 30 — dbt models**
- `stg_orders`, `stg_customers`, `stg_products`, `stg_events`
- `mart_customer_cohorts`, `mart_product_performance`, `mart_funnel`
- Scheduled via GitHub Actions daily run

**Day 31 — pgvector setup**
- Supabase free tier with pgvector extension
- Product embeddings via OpenAI `text-embedding-3-small` (cheap) or Claude API
- Symptom embeddings (quiz answers pre-embedded)
- Ingestion pipeline: product metadata → embedding → Supabase

**Day 32 — ML v1 recommendation engine**
- Custom app endpoint `/api/recommend`
- Vector search (cosine similarity) + reranking
- Returns top 3 protocols + top 5 products
- Served to storefront via Storefront API custom endpoint
- ADR-012: pgvector over Pinecone

**Day 33 — Contraindication rules engine**
- Structured rules DSL in YAML
- Evaluated at cart (Function) + at recommendation time (app)
- Unit tests per rule
- Admin UI to edit rules

**Day 34 — Distributed tracing via Sentry**
- Sentry distributed tracing instrumentation across browser (Hydrogen) + Remix loader + custom app (Cloudflare Workers) + Shopify GraphQL + Functions
- Trace IDs propagated across all layers (one trace per user journey)
- Cloudflare Workers Logs wired via `logpush` → Sentry breadcrumbs
- ADR-015: Sentry distributed tracing over separate OTel collector + Honeycomb (single-vendor simplicity + zero infra)

**Day 35 — SLOs + error budgets + synthetic checks**
- `docs/SLO.md` with 5 SLOs defined (checkout 99.5%, search p95 <300ms, LCP p75 <2s, API p95 <500ms, recommendation engine p95 <800ms)
- Sentry Alerts + Sentry Performance dashboards
- **Cloudflare Worker cron synthetic** — hits checkout + quiz + PDP + ML recommendation endpoint every 10 min, fails to Sentry alert channel
- Error-budget burn-rate alerts
- Tag `v0.5-week5-ml-observability`

#### Week 6 — Quality + Security + i18n + SEO + Compliance
**Day 36 — Accessibility pass**
- Run axe on every route
- VoiceOver / NVDA / JAWS walkthroughs on PDP + quiz + cart + checkout
- Keyboard-only end-to-end
- Contrast audit; fix any <4.5:1
- Focus-appearance + target-size (WCAG 2.2) verified
- Update ACCESSIBILITY.md

**Day 37 — Performance pass**
- Lighthouse baseline; measure LCP / CLS / INP
- Hydrogen streaming tuning
- Image optimization audit (AVIF/WebP via Hydrogen `Image`)
- Font preload + subset
- Route-level cache headers
- Edge-rendered above-fold via Cloudflare Worker
- Target Lighthouse 95+ all 4 categories
- Update PERFORMANCE.md

**Day 38 — i18n + RTL + Markets**
- Extract all strings to `locales/*.json` (5 locales)
- Arabic RTL with CSS logical properties
- CLDR plurals
- `hreflang` per locale + market
- Market-specific catalog switch verified

**Day 39 — SEO + schema**
- All 10 JSON-LD schemas implemented + validated
- Sitemap + robots.txt
- Meta + OG + Twitter cards per route
- Google Rich Results test clean

**Day 40 — Security hardening**
- CSP via `headers()` — hashed + strict-dynamic
- Rate limiting (Cloudflare Worker middleware + custom app throttle)
- gitleaks + CodeQL + Trivy + ZAP all green
- SBOM generated (CycloneDX)
- SLSA provenance workflow
- Signed commits enforced on `main`
- Update SECURITY.md

**Day 41 — Compliance-as-code**
- `compliance-lint.yml` workflow
- FDA claim linter: regex patterns + Claude-API call for ambiguous cases
- DSHEA disclaimer CI check
- Contraindication CI check
- Age-gate enforcement Playwright test
- ADR-016: compliance-as-code

**Day 42 — Feature flags + A/B (Phase 1 = localStorage; Statsig deferred to Phase 2)**
- `lib/flags.ts` — localStorage-backed flag resolver with URL override, Do-Not-Track respect, exposure analytics event
- 3 active experiments in demo mode: hero variant, PDP layout, checkout trust-badge order
- Exposure events → BigQuery via RudderStack → dbt mart
- Statsig wiring deferred to Phase 2 Day 71 (when real traffic justifies real A/B infra + Statsig signup)
- ADR-014: localStorage flags in Phase 1, Statsig in Phase 2+ (staged adoption vs day-1 dependency)
- Tag `v0.6-week6-quality`

#### Week 7 — Documentation + Case study + Phase 1 deliverables
**Day 43 — Documentation sprint**
- README.md, CONTRIBUTING.md, CHANGELOG.md (Keep-a-Changelog)
- ACCESSIBILITY, PERFORMANCE, SECURITY, TESTING, COMPLIANCE, DATA-MODEL, RUNBOOK, API-SPEC (OpenAPI 3), ML-PIPELINE, SLO, DESIGN-TOKENS, B2B-GUIDE, MARKETS-GUIDE, MERCHANT-GUIDE, ROADMAP (Phase 2 + 3 gated map)
- AI-WORKFLOW.md filled with real prompt log + velocity data
- AI_GOVERNANCE.md multi-assistant honest framing
- All 20 ADRs finalized in `/docs/adr/`

**Day 44 — Docs micro-site + architecture diagrams**
- Astro Starlight init, deployed to Cloudflare Pages
- C4 model diagrams (Structurizr OSS / Mermaid embedded)
- OpenAPI spec viewer
- ADR index
- Search

**Day 45 — Case study site + Loom + Phase 1 release**
- Case-study site on Cloudflare Pages (distinct from docs site)
- Sections: hero + challenge + approach + solution + results + AI workflow + tech stack + links
- 5-minute Loom walkthrough recorded: storefront tour + admin walkthrough + Function demo + ML demo + multi-AI workflow demo
- Final visual regression baseline (Percy)
- All 16 CI workflows green
- Tag `v1.0-phase1-complete`

---

### PHASE 2 — Days 46–75 (Mobile + Community + Sleep/Mental/Stress/Meditation catalog)

#### Week 8 — Mobile foundation
**Day 46 — React Native / Expo scaffold**
- `npx create-expo-app@latest`
- TypeScript + Tailwind (NativeWind) + Expo Router
- Shared types from `@regenai/ui` (subset for mobile)
- ADR-021: mobile framework choice

**Day 47 — Mobile Storefront API integration**
- Product browse + cart + checkout handoff
- Customer auth SSO with Shopify customer accounts

**Day 48 — Mobile auth**
- Shopify mobile auth SDK OR Supabase Auth as SSO bridge
- ADR-022: auth strategy

**Day 49 — Push notifications**
- OneSignal free tier integration
- Server-side trigger via custom Remix app webhook
- Subscription reminders, protocol adherence nudges
- ADR-023: push vendor choice

**Day 50 — Multi-device BLE pairing**
- Posture sensor (Phase 1 device) + sleep tracker + HRV ring
- Expo BLE module
- Connection state UI + error recovery
- ADR-024: BLE pairing architecture

**Day 51 — HealthKit + Google Fit OAuth**
- iOS HealthKit: sleep stages, HRV, SpO2, activity
- Android Google Fit mirror
- Data ingestion → custom app → warehouse
- ADR-025: health data model (proprietary vs HealthKit-canonical)

**Day 52 — Mobile observability**
- Sentry mobile SDK
- Segment mobile SDK → RudderStack
- Crash reporting + performance metrics

#### Week 9 — Phase 2 catalog + content
**Day 53 — Sleep tracker PDP + protocol**
- PDP with BLE pairing flow inline
- Sleep protocol metaobject
- Sleep dashboard template data model

**Day 54 — Weighted blanket + sleep mask PDPs**
- Variant picker (weight, size)
- Clinical protocol linkage

**Day 55 — Vagus-nerve stim + HRV biofeedback PDPs**
- Mental wellness category landing

**Day 56 — Cold immersion + breathwork PDPs**
- Restricted-product handling (some stress devices gate 18+)

**Day 57 — Meditation headband + tactile PDPs**
- Neurofeedback pairing demo

**Day 58 — Cross-vertical ML v2**
- Multi-domain embeddings (physio + sleep + mental)
- Cohort recommendations ("users who bought posture sensor also improved sleep with X")
- ADR-026: ML v2 embedding strategy

**Day 59 — Sleep dashboard template + content expansion**
- Sleep-stage + HRV history view
- Sanity content: 50 clinical articles on sleep + mental wellness

#### Week 10 — Community + moderation
**Day 60 — Community platform scaffold**
- Remix route `/community` + Supabase free tier
- Threads + posts + replies data model
- SSO from Shopify customer → Supabase
- ADR-027: build vs Discourse SSO

**Day 61 — Community UI**
- Thread list + detail + new-post flow
- Reactions + saves
- Moderator tools (pin, lock, delete)

**Day 62 — Moderation pipeline**
- OpenAI Moderation API on every post
- Human-review queue in custom app
- Escalation policy for crisis flags
- ADR-028: content moderation workflow

**Day 63 — Crisis flagging**
- Suicide / self-harm detection → immediate redirect to crisis resources (US 988, UK Samaritans, localized per market)
- Moderator alert + follow-up protocol

**Day 64 — Cohort pages**
- Insomnia, anxiety, athletic recovery, chronic pain
- Metaobject-driven content + community channel linked

**Day 65 — Community × Shopify integration**
- Product mentions auto-link to PDP
- Protocol mentions auto-link to protocol page
- Tracked events for conversion attribution

**Day 66 — APAC market expansion**
- Shopify Markets: + Japan + Singapore + Australia
- Market-specific compliance (Japan PMDA segmentation)

#### Week 11 — Phase 2 polish + deliverables
**Day 67 — Mental wellness compliance**
- Crisis resources localized per market
- Age gating 18+ enforced on neuro-devices
- Content moderation SLA documented

**Day 68 — HIPAA-active pipeline**
- Data minimization defaults
- Audit logs for any PHI access
- Encryption-at-rest verified
- BAA-ready documentation (vendor list, data flow diagram)

**Day 69 — Phase 2 ADRs finalized**
- ADRs 21–30 written + reviewed

**Day 70 — Phase 2 docs**
- MOBILE-GUIDE.md
- COMMUNITY-GUIDE.md
- Updated COMPLIANCE.md with Phase 2 additions
- Updated DATA-MODEL.md with mobile + community + sleep domains

**Day 71 — ML v2 production launch**
- Cross-vertical recommendations live
- A/B tested against ML v1 via Statsig
- Performance metrics in dashboard

**Day 72 — Observability additions**
- Mobile RUM metrics
- Content-moderation latency + queue depth
- Community engagement metrics

**Day 73 — Phase 2 QA sprint**
- Full regression pass across storefront + mobile + community
- Playwright suite expanded to cover new flows

**Day 74 — Phase 2 case study chapter**
- New section in case-study site: "From physio to full wellness — how the platform scaled"
- Mobile demo Loom (3 min)

**Day 75 — Phase 2 tag + release**
- Tag `v2.0-phase2-complete`
- All 22 CI workflows (6 new: mobile build, mobile tests, mobile preview, community-mod queue health, HealthKit contract, APAC locale check) green
- Release notes published

---

### PHASE 3 — Days 76–105 (Full wellness: Nutrition + AI monitoring + Home gym + Women's health + Anti-aging + Platform)

#### Week 12 — Nutrition & supplements
**Day 76 — Supplement catalog**
- 15 SKU setup with DSHEA metafields
- Ingredient + allergen + third-party test metaobjects
- Automated DSHEA disclaimer injection
- Age-appropriate labeling

**Day 77 — Personalized supplement stack builder**
- Quiz-driven UI → ML-powered stack recommendation
- Contraindication overlay
- Budget-tier selector

**Day 78 — Supplement subscription cadence engine**
- Custom cadence logic (monthly / bi-monthly / per-cycle)
- Rotating stack formulation A/B
- Delayed-release logic for high-cost items
- ADR-031: custom cadence over Recharge

**Day 79 — Biomarker → supplement ML v3**
- Causal inference layer (uplift models / synthetic-RCT)
- Requires biomarker data integration (Day 80)
- Clinician-reviewed recommendations only
- ADR-032: causal inference framework

**Day 80 — Biomarker lab integration**
- Function Health + InsideTracker + Quest + Labcorp partner API mocks (real integrations require paid contracts — scope as ADR only)
- HL7 FHIR-compliant data model
- Biomarker dashboard template
- ADR-033: biomarker data model

**Day 81 — Supplement claim review workflow**
- Pharmacist + clinician dual-sign required for biomarker-linked claims
- Workflow built into custom app clinician-review module
- Audit trail

**Day 82 — Women's health data residency**
- State-by-state routing logic
- Data-minimization defaults (ephemeral session, no long-term PII retention for menstrual data)
- Post-Dobbs US compliance pattern
- ADR-035: women's-health data sovereignty

#### Week 13 — AI monitoring + home gym
**Day 83 — CGM-adjacent + wellness devices**
- Stelo / Lingo partnership mockup (non-diabetic CGM)
- PDP with clinician oversight messaging

**Day 84 — Smart ring PDPs**
- HRV / temperature / BP rings
- Multi-device family page

**Day 85 — At-home biomarker test kit flow**
- Order → shipped kit → sample return → lab processing → results in app
- End-to-end workflow modeled (mocked where needed)

**Day 86 — Home gym smart equipment PDPs**
- Smart mirror + cables + bike
- Large-item shipping + installation option
- Financing indicator (Shop Pay / Affirm surface)

**Day 87 — Smart gym IoT pipeline**
- Device registration in custom app
- Mock firmware OTA update flow
- Telemetry ingestion → warehouse
- ADR-034: IoT platform (AWS IoT Core vs self-managed)

**Day 88 — AI coach form-correction demo**
- Uses webcam + MediaPipe (free, in-browser)
- Exercise form feedback demo (not production inference, UX demo)

**Day 89 — Cross-border device segmentation**
- Market catalogs: US (FDA) vs EU (CE) vs Japan (PMDA) vs AU (TGA)
- Restricted-product display logic verified in each market

#### Week 14 — Women's health + anti-aging
**Day 90 — Women's health catalog**
- Pelvic-floor, menstrual, postpartum, PCOS, menopause SKUs
- Dedicated metaobject track

**Day 91 — Women's health hub**
- Cohort-specific content (postpartum week-by-week, menopause stages)
- Community channels gated to cohort

**Day 92 — Menstrual tracking privacy**
- Explicit opt-in + local-first storage
- Delete-on-request DSAR endpoint tested
- No third-party analytics on menstrual-data routes

**Day 93 — Anti-aging catalog**
- Red-light therapy, NAD+ precursors, collagen devices, biological-age testing
- DSHEA-compliant peptide disclaimers

**Day 94 — Longevity protocol builder**
- Multi-month protocols
- Biomarker re-test cadence built in
- Clinician sign-off required for any claim

**Day 95 — Peptide claim taxonomy**
- Allowed claims (DSHEA) vs restricted (prescription-adjacent) vs prohibited
- CI check on product copy enforces taxonomy
- ADR-036: peptide / supplement claim taxonomy

**Day 96 — Age gating enforcement**
- 18+ + 21+ + clinician-verified tiers
- Hardware-backed session (FIDO2 optional)
- Playwright tests enforce gate
- ADR-037: age gating architecture

#### Week 15 — Platform layer + deliverables
**Day 97 — Multi-tenant B2B SaaS admin**
- Tenant schema isolation (row-level or schema-per-tenant, see ADR-038)
- Tenant-level branding (logo, color, domain)
- API key management per tenant
- Usage metering
- ADR-038: multi-tenancy architecture

**Day 98 — White-label partner flow**
- Partner onboarding
- Custom subdomain routing (via Cloudflare Worker)
- Co-branded Hydrogen theme

**Day 99 — Shopify POS integration**
- Shopify POS Lite (free with plan)
- Inventory sync verified
- Retail location metaobjects
- ADR-039: retail POS architecture

**Day 100 — International 3PL routing**
- Multi-3PL ADR (no real 3PL contract; routing logic modeled)
- Per-market fulfillment route table
- Carbon-offset option (free via Shopify Planet)
- ADR-040: 3PL routing

**Day 101 — Telehealth partner integration scaffolds**
- Ro / Hims scope-of-practice mapping
- Restricted-product gating (supplement stacks requiring telehealth clearance)
- Partner API stubs

**Day 102 — Phase 3 compliance docs**
- DSHEA full posture
- EU MDR auth rep strategy
- PMDA (Japan) segmentation
- US state residency for women's-health data
- Cross-border supplement restrictions matrix

**Day 103 — Phase 3 ADRs finalized**
- ADRs 31–45 + 5 additional (40–45: 3PL, telehealth, international compliance, white-label, platform pricing)
- Total ADR count now 45

**Day 104 — Phase 3 case study chapter**
- New chapter: "From wellness DTC to platform — how RegenAI licenses its recommendation engine"
- 5-minute Loom: platform admin walkthrough + biomarker demo + women's-health compliance walkthrough

**Day 105 — Final tag + release**
- Tag `v3.0-phase3-complete`
- All 28 CI workflows green (new: biomarker contract, HIPAA audit log verifier, tenant isolation test, PMDA locale check, telehealth scope-check, age-gate e2e, women's-health residency check)
- 48 templates live
- 48 docs + 45 ADRs
- Docs micro-site + case study site updated
- 150+ SKUs modeled (fictional portfolio-safe)
- Final visual regression baseline
- Release notes
- **RegenAI v3.0 complete — end-to-end 3-phase wellness platform, $0 infrastructure, ready for portfolio submission**

---

## 12. Final deliverables

1. **Live Shopify storefront** (on Partner Plus Development Store) — public URL, full 48 templates, 150+ SKUs, 5 markets, 5 locales
2. **GitHub repo** (public)
   - Clean conventional commits with signed trailers
   - Branch protection on `main`, linear history
   - 28 GitHub Actions workflows green
   - 48 docs + 45 ADRs + OpenAPI spec + C4 diagrams
   - Semantic version tags: v0.1 → v1.0-phase1 → v2.0-phase2 → v3.0-phase3
3. **Docs micro-site** (Cloudflare Pages, Astro Starlight)
4. **Case study site** (Cloudflare Pages)
5. **Loom walkthroughs** (3 total — Phase 1, Phase 2, Phase 3)
6. **Design system** — `@regenai/ui` published npm package + Storybook on GitHub Pages
7. **Metrics proof:**
   - Lighthouse 95+ screenshots (all 4 categories)
   - Core Web Vitals dashboard
   - axe clean report
   - Sentry / Grafana SLO dashboards
   - Playwright + Vitest + Percy + Storybook reports
   - k6 load test results
   - Compliance-as-code CI screenshots
8. **Client-style deliverables:** SOW, project timeline, merchant handoff guide, roadmap, compliance posture doc
9. **Retrospective blog post** — "Building a 3-phase wellness platform at $0 — what scales free, what doesn't, when to graduate to paid"

---

## 13. JD coverage check — Anderson Collaborative

| JD Requirement | Covered by RegenAI |
|---|---|
| **Mandatory: Shopify** | ✅ Full Plus feature stack on Dev Store |
| **Mandatory: cursor** | ✅ Logged in AI-WORKFLOW with real commit evidence |
| **Mandatory: OpenAI Codex** | ✅ Logged in AI-WORKFLOW with real commit evidence |
| **Mandatory: Microsoft 365 Copilot** | ⚠️ Honest note in AI-WORKFLOW — substitutable with Copilot for equivalent IDE work |
| **Mandatory: GitHub Copilot** | ✅ Logged in AI-WORKFLOW with real commit evidence |
| **Must: 3+ yrs Shopify** | ⚠️ User-specific; portfolio demonstrates capability |
| **Must: Liquid/JS/HTML/CSS** | ✅ Admin theme uses Liquid snippets; frontend is React/TS but Liquid artifacts exist in `extensions/` |
| **Must: AI tools hands-on** | ✅ 4 AI assistants wired + logged |
| **Must: Custom theme + Shopify APIs** | ✅ Storefront API, Admin API, Functions, App Proxy |
| **Must: Performance + CRO** | ✅ Lighthouse 95+, Statsig A/B infra, 3 active experiments |
| **Must: Work independently + fast** | ✅ 105-day solo delivery with 45 tags |
| **Nice: Shopify Plus** | ✅ Full Plus stack (B2B, Markets, Functions, Checkout Extensibility) |
| **Nice: Headless (Hydrogen / Next.js)** | ✅ Hydrogen is core architecture |
| **Nice: E-commerce brands/agencies** | ⚠️ Fictional brand, agency-style SOW + handoff deliverables |
| **Nice: SEO + page speed** | ✅ 10 JSON-LD schemas, edge-rendered, <1.8s LCP |

**Proposal questions coverage:**
1. AI tools — ✅ 4 tools actively used, logged with before/after
2. Recent project — ✅ RegenAI + Kindred Grove
3. 2–3 store links — ✅ RegenAI live storefront + Kindred Grove + case study site = 3 links

---

## 14. Out of scope

- Real Shopify Plus paid plan (use Partner Plus Dev Store)
- Custom domain / business registration (deferred until real launch)
- Real AliExpress / CJ Dropshipping / supplier integration (fictional catalog for portfolio)
- Real manufacturing / fulfillment partnerships (scoped as ADR only)
- Real telehealth partner contracts (mocked integration only)
- Real lab partner contracts (mocked only)
- Real FDA 510(k) filings
- Real DSHEA supplement manufacturer partnerships
- Real 3PL contracts
- Real physical retail lease
- Real mobile app store submission (scaffolded + TestFlight / internal track only)
- Real international EU MDR auth rep
- Paid SaaS tiers on any service (operate entirely on free tiers)
- Apple Developer Program / Google Play fees (scoped as future launch cost only)
- GLP-1 / prescription peptide handling (excluded — DSHEA-compliant only)

---

## 15. Pre-flight checklist

**State as of Day 0 (2026-04-20) — live-tested this session:**

Confirmed ready:
- [x] Shopify Partner account — active (reused from Kindred Grove)
- [x] Partner Plus Dev Store — `regenai.myshopify.com` provisioned with Plus preview + Multiple Business Entities feature preview
- [x] Admin custom app `regenai-admin` installed with full scopes (`write_companies` for B2B, `write_markets`); token **HTTP 200** live-tested
- [x] GitHub — `gh` CLI authed as `Zahidulislam2222`
- [x] Cloudflare — Wrangler authed, account ID `f523a94f3089b05b1943314df3fd2624`, full Workers + Pages + D1 + AI scopes (hosts storefront edge + custom Remix app + docs site + case study + edge personalization + synthetic cron)
- [x] gcloud — authed for BigQuery (Day 29 warehouse)
- [x] Supabase — project `regenai` provisioned in East US, service_role live-tested HTTP 200
- [x] Sanity — project `regenai-cms` provisioned, Editor token live-tested HTTP 200
- [x] Klaviyo — reused existing account, Public `UqGK34` + Private key live-tested HTTP 200
- [x] Sentry org `zahidul-islam-71` — exists, 4 project DSNs to mint Day 3 via CLI
- [x] Percy — reused Kindred Grove account, project token to mint Day 3 via API
- [x] npm — `@regenai` org created (Free tier), access token in `.env`
- [x] Shopify Dev MCP — connected (reused from KG)
- [x] Claude Code Max — active
- [x] Local env: Node 20+, Shopify CLI 3.93.2, `gh`, `wrangler`, `gcloud`, Python
- [x] Project folder: `D:/Website and project/Shopify/RegenAI/`
- [x] Brand name: RegenAI
- [x] Timeline: 105 days target, honest delivery band 105–130 days

Deferred — I mint via API/CLI during the build (no user action needed upfront):
- [ ] Storefront API tokens → Day 2 (via Admin API)
- [ ] Cloudflare API token → Day 3 (via Wrangler)
- [ ] Sentry project DSNs × 4 + auth token → Day 3 (via Sentry CLI)
- [ ] Percy project token → Day 3 (via Percy API)
- [ ] Judge.me API token → Day 12 (after app install)
- [ ] Klaviyo list ID → Day 12 (via Klaviyo API)
- [ ] GA4 measurement ID + stream ID → Day 29 (via gcloud)
- [ ] GCP project + BigQuery + service-account JSON → Day 29 (via gcloud CLI)
- [ ] Rust toolchain → Day 16 (local `rustup` install)
- [ ] OpenAI API key → Day 31 (user does $5 billing + pastes key)

Phase 2 signups — deferred to Day 46+:
- [ ] Statsig account, Expo / EAS, OneSignal, Apple Developer Program ($99/yr), Google Play Console ($25 one-time)

---

## 16. Risk mitigation

| Risk | Mitigation |
|---|---|
| **Timeline slip (105 days is tight for 4-layer / 3-phase scope)** | Phase-gate releases; each phase shippable standalone. Honest delivery band 105–130 days. Flag slip weekly. If tight at Day 40, drop Phase 3 retail POS + smart gym IoT first, then Phase 3 white-label SaaS (convert to ADR-only) |
| Hydrogen learning curve | Day 1–2 dedicated to Hydrogen + Remix onboarding; use Shopify official templates; AI-WORKFLOW tracks first-week velocity to detect drag |
| ~~Partner Plus Dev Store request rejected~~ | **Resolved Day 0** — store provisioned with Plus preview |
| Multi-AI tool coherence | AI_GOVERNANCE defines explicit role per tool; no overlap |
| Real ML demo feels faked | Use real pgvector (Supabase provisioned) + real embeddings; log actual inference calls; demo in Loom |
| WebBluetooth demo without hardware | Default to `web-bluetooth-mock` simulated peripheral in browser — demo-ready without buying hardware. Optional real device ($30-80) later |
| Compliance theater risk | Compliance-as-code CI checks documented as *signals of discipline*, not substitutes for regulatory counsel |
| CI flakiness | Keep CI <8 min full suite; Playwright retry logic; parallel shards |
| Mobile BLE unreliable in CI (Phase 2) | Simulate BLE peripheral locally; e2e mobile tests run on Detox + Expo EAS |
| Community moderation crisis (Phase 2) | OpenAI Moderation + human-review queue + documented escalation; crisis-flagging never deployed without working resource links |
| A11y regressions | axe in CI + Storybook a11y addon + WCAG 2.2 manual checklist per phase |
| Visual regressions | Percy baselined per phase (page-level); Storybook a11y addon catches component-level regressions |
| Cloudflare free-tier rate limits (100k req/day per Worker) | Scope each Worker (edge middleware, custom app, synthetic cron) separately — each gets its own 100k budget. Unlikely to hit during build; monitored via CF dashboard |
| ADR drift | PR template requires "ADR needed?" checkbox; ADR index in docs micro-site |
| Secret handling in chat | Per feedback memory: dual-write secrets to GitHub Secrets + local `.env` in the same turn to avoid orphaned secrets |

---

## 17. Success metric

**The 60-second test:** When a CTO / agency reviewer spends 60 seconds on your portfolio, they see:

1. **Live storefront** → "Looks like Therabody / Oura / Eight Sleep" — clinical, modern, trust-first
2. **GitHub repo** → 28 green CI workflows, 45 tags across 3 phase releases, 48 docs + 45 ADRs + OpenAPI + C4 diagrams
3. **Docs micro-site** → full searchable documentation, architecture diagrams, ADR index
4. **Case study site** → 3 phase chapters, real metrics, multi-AI workflow evidence, live demo links
5. **3 Loom walkthroughs** → "They shipped a 4-layer Shopify Plus commerce platform solo in 105 days. Using 4 AI assistants. With compliance-as-code. At zero infrastructure cost. This person runs a Plus practice."

**If all five signals land, the portfolio is not just ready — it is overqualified for any sub-$50k Shopify freelance posting, and competitive for $80–120k Shopify Plus agency senior / staff roles.**

---

## 18. What this plan signals

| Bar | What RegenAI delivers |
|---|---|
| Junior Shopify dev | ✅ Wildly exceeded |
| Mid-level Shopify dev | ✅ Wildly exceeded |
| Senior Shopify dev at agency | ✅ Exceeded |
| Staff / lead at agency (Shopify Plus practice) | ✅ Matched |
| Principal / head of commerce engineering | ✅ Approached — with 4-layer architecture, multi-year platform evolution, compliance-as-code, real ML, and multi-tenant SaaS layer, this is principal-tier signal |
| CTO reading this | ✅ Signals "commerce platform architect who thinks about multi-year scale, regulatory surfaces, and operational reality — not just features" |

**This is not a portfolio project. This is a productized senior-staff commerce capability proof.**

---

## 19. Phase gates + velocity targets

| Phase | Days | Wall-clock target (at ~5–6 hr/day focused) | Tag | Reviewable artifact |
|---|---|---|---|---|
| Phase 1 | 1–45 | ~250 hrs | `v1.0-phase1-complete` | Storefront + custom app + Functions + B2B + Markets + ML v1 + 22 docs + 20 ADRs + case study site |
| Phase 2 | 46–75 | ~170 hrs | `v2.0-phase2-complete` | Mobile app + community + sleep/mental catalog + ML v2 + 10 more docs + 10 more ADRs |
| Phase 3 | 76–105 | ~170 hrs | `v3.0-phase3-complete` | Full wellness catalog + platform / white-label + biomarker + women's-health + anti-aging + 15 more docs + 15 more ADRs |
| **Total** | **105** | **~590 hrs focused** | **v3.0** | **Complete 4-layer 3-phase wellness platform** |

**Velocity target:** ~8× multiplier vs hand-coded equivalent. Hand-coded estimate for this scope: 4,500–5,500 hrs (2.5–3 years solo). AI-assisted target: 590 hrs (15 weeks solo).

---

## 20. Cost model — confirmed $0

**During build (105 days):**
- Shopify: $0 (Partner Plus Dev Store)
- Hosting: $0 (Oxygen + Cloudflare Workers + Pages + D1 all on existing CF account)
- Data/ML: $0 (BigQuery + Supabase + dbt Core all free)
- Observability: $0 (Sentry reused existing org + CF Workers Logs)
- Testing: $0 (Percy reused from KG; Storybook on GitHub Pages)
- Feature flags: $0 (localStorage in Phase 1; Statsig free tier Phase 2+)
- CMS: $0 (Sanity free tier — provisioned)
- Security: $0 (CodeQL + ZAP + Trivy + Syft + gitsign all OSS or free on public repos)
- CI: $0 (GitHub Actions free on public repos)
- **Total: $0/month infrastructure**

**Only one-time paid item during build:** OpenAI $5 credit at Day 31 for ML embeddings (deferred; user approves when we get there).

**Personal tool subscriptions (excluded per user direction):** Claude Code Max (already have), Cursor Pro (optional), ChatGPT Plus (optional), Apple Developer $99/yr + Google Play $25 one-time (Phase 2 only if shipping mobile apps publicly — internal test track is free).

**When to graduate to paid tiers (post-launch only):**
- Klaviyo paid: ~1k contacts (~$45/mo start)
- Segment paid: ~1k visitors/mo (or stay on RudderStack OSS forever)
- Sentry Team: ~10k errors/mo (~$26/mo)
- Cloudflare paid: scale beyond free-tier Worker req limits (still cheap — $5/mo Workers Paid unlocks 10M req/mo)
- Sanity paid: beyond 10k documents or 1M API calls
- Supabase paid: beyond 500 MB DB or 50k MAU
- Statsig paid: beyond 1M events/mo
- Shopify Plus: only when actually selling (~$2,500/mo)

**Everything scales from $0 → paid at real traffic, not arbitrary. No tier trigger during portfolio build.**

---

**End of plan.**
