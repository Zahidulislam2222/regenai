# ADR-010 — Sanity CMS alongside Shopify metaobjects

**Status:** Accepted
**Date:** 2026-04-20 (Day 10)
**Deciders:** RegenAI solo build — Zahidul Islam

## Context

RegenAI's PDP carries far more editorial + clinical content than a typical DTC product page:

- Clinical protocols (5–15 structured steps with durations, intensities, contraindications)
- Contraindication callouts (FDA Class II awareness, pregnancy/pacemaker/acute-injury gating)
- Study references (PubMed IDs + DOIs — 3–10 per SKU)
- Certifications (FDA 510(k), CE mark, ISO 13485, NSF, GMP)
- FAQ with medical-literacy framing
- Product education long-form (mechanism-of-action, "why it works")
- Clinician endorsements with credentials
- Body-area taxonomy (Phase 2 body-map selector)
- Localized clinical copy (EN, ES, FR, DE, AR — with FDA vs CE-marked variant copy per market)

Day 10 shipped PDP part 2 with components driven by props. Those props need to come from *somewhere authoritative* — not hand-rolled into route files.

Two candidate content stores in play:

1. **Shopify metaobjects + metafields** — native, co-located with products, zero extra SaaS, editable in Shopify admin. Storefront API access is free. Limited to Shopify's schema primitives (references, rich_text_field, file_reference, dimension, volume, number_decimal).
2. **Sanity CMS** — headless CMS with GROQ, real-time preview, structured content, block content editor, strong localization, portable text, reference fields, conditional field visibility. Free tier: 10k documents, 3 users, 20GB bandwidth — sufficient for Phase 1.

## Decision

**Use both, with a clean per-content-type split:**

### Shopify metaobjects → commerce-adjacent content
- Certifications (referenced from Product → metaobject list)
- Contraindication flags (enum-typed references)
- Body-area taxonomy (metaobject with parent/child references)
- Clinical protocol steps (metaobject with duration, intensity, note)
- Study references (metaobject: pmid, doi, title, year, authors, journal, summary)

**Why Shopify-side:** these fields are queried at the same time as the product, in the same GraphQL request. They carry taxonomy relationships to other products (cross-sell via "same body area"). Catalog team edits them in Shopify admin alongside product fields. Compliance-lint CI (Day 41) needs them in Shopify because the compliance-lint check runs on product payloads from Storefront API.

### Sanity → editorial + educational content
- Long-form mechanism-of-action copy
- Clinician bio pages + endorsement quotes
- Blog/journal content (Phase 2)
- Marketing pages (`/pages/science`, `/pages/about`, `/pages/compliance`)
- FAQ content libraries (shared across SKUs)
- Legal / policy pages (returns, warranty, privacy)
- Localized page-level hero banners + campaign promos

**Why Sanity:** these are *publications*, not product attributes. Editors need real-time preview, block content editing (not plain rich_text), and references across content domains unrelated to SKUs. Sanity's portable-text block editor is where marketing + clinician content teams already work.

## Boundary rule

A single piece of content lives in exactly one store. If a reference is needed, Shopify-side content gets a `sanity_ref` metafield (string handle or `_id`) and the storefront resolves it at render. No duplicated content, no two-way sync.

The boundary heuristic: *"if the compliance-lint CI needs to validate it against the product's FDA class, it belongs in Shopify metaobjects. Otherwise Sanity."*

## Alternatives rejected

- **Metaobjects only.** Rejected — metaobject rich_text_field is a stripped-down markdown subset, editors need proper block content for science articles, portable text enables embedded citations and callout rendering that rich_text_field cannot represent cleanly.
- **Sanity only.** Rejected — would double-up Shopify admin work (certifications, body areas must sync to Shopify for faceted search + compliance-lint), introduces a sync layer (Sanity → Shopify) that the Phase 1 build cannot afford to maintain.
- **Contentful, Storyblok, Hygraph.** Rejected as functionally equivalent to Sanity for this use case but with worse free-tier limits (Contentful: 25k API calls, Hygraph: asset size limits). Sanity free tier is the most generous for a single-editor build.
- **Notion-as-CMS.** Rejected — no real-time preview, no CDN, editorial surface leaks structural complexity.
- **MDX files in-repo.** Rejected for clinician/marketing content (non-engineers can't edit), retained for ADRs + internal runbooks.

## Consequences

**Positive**
- Clean separation: compliance-critical structured data in Shopify where the compliance-lint CI already runs, narrative content in Sanity where editors can preview + collaborate.
- Localization paths are native in both systems (Shopify Markets for metaobjects; Sanity's `i18n` plugin for content).
- No sync layer to maintain.
- Both free tiers in Phase 1.

**Negative**
- Two admin surfaces for editors to learn.
- Storefront routes will hit Sanity's CDN alongside Storefront API for pages that blend both (about + science pages). Mitigation: Cloudflare KV edge cache on Sanity queries (Day 33).
- A single "product detail + clinical deep-dive" page will make two network calls. Mitigation: Hydrogen `defer`/streaming for Sanity content below the fold.

## Reversibility

Medium cost. If Sanity is dropped, content would need to migrate to metaobjects (losing block content fidelity) or to MDX (losing editor workflow). Content volume in Phase 1 is small (~20 pages), so migration cost stays bounded through Day 45. After Day 45 (Phase 2 body-area pages + Phase 3 platform content), reversibility degrades sharply.

## References

- PROJECT_PLAN.md §3 "Commerce + content stack"
- ADR-001 — Hydrogen over Liquid
- ADR-002 — Tailwind v4 + shadcn/ui ownership
- Day 10 PDP part-2 components — `packages/storefront/app/components/pdp/*`
