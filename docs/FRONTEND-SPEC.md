# Recovery lab — frontend acceptance specification

Written before implementation, 2026-09-21. Scope: local customer storefront for review.

## Direction and alternatives

1. Clinical catalog: direct shopping, but insufficient identity for this brief.
2. Continuous fantasy scroll world: expressive, but delays comparison and invents a setting unrelated to the devices.
3. **Recovery lab (selected):** monumental blue type on warm bone; a deliberately art-directed product still; a bounded scroll product inspection; functional product selection, finder, and bag. Commercial actions never depend on finishing an animation.

The original brief's clinical blue, bone, sans typography and product-first imagery remain. No fake clinician endorsement, clearance, reviews, medical outcomes, discount urgency, or claimed AI inference. Product renders and prices are fictional demo data. New UI lives in reusable `app/features/recovery`; the local Vite preview harness uses the existing React/Router dependencies. Existing Hydrogen loaders remain intact for explicit integration in the next phase. Do not deploy the local cart as production commerce.

## Acceptance criteria

| ID | Required behavior | Verification |
|---|---|---|
| F01 | Local preview starts with one documented command and no Shopify/generation credential in browser | HTTP request; inspect client output |
| F02 | Distinct product-led homepage with reviewed original imagery, readable hierarchy and working primary CTAs | Desktop/mobile screenshots and CTA navigation |
| F03 | Scroll-linked product section responds in both directions; reduced motion shows all essential information statically | Browser scroll and emulated preference |
| F04 | Catalog filters, search, sort and reset change actual fixture results; empty state works | Browser assertions |
| F05 | Each product has a working deep link, image, description, selectable option, price and add-to-bag | Direct visit and interaction |
| F06 | Bag supports add, quantity change, remove, empty state, subtotal and refresh persistence | Browser flow; invalid storage test |
| F07 | Finder validates each step, supports back/restart and returns deterministic explained matches | Browser complete/back/reset paths |
| F08 | Mobile menu and bag dialog support keyboard, Escape, focus restoration and no background interaction | Browser keyboard test |
| F09 | About/evidence/policy links have useful content; unknown route gives an honest 404 view | Route traversal |
| F10 | No horizontal overflow at 390px/768px/1440px; no missing images or uncaught browser errors | Browser measurements |
| F11 | Core routes pass axe; focus visible; media has a fallback; core content visible without motion | axe + manual inspection |
| F12 | Tests/type/lint/build/security results and configuration audit recorded; limitations explicit | Saved gate report |

## Configuration ownership before implementation

| Values | Owner |
|---|---|
| Brand copy, navigation, product demo prices/options/metadata, finder questions, policies | Validated content under `app/content/` |
| Preview host/port and local cart operational limits | `app/config/` / preview settings; safe env examples |
| Colors, typography, spacing and motion behavior | Recovery CSS token layer |
| Media paths/alt/factual status/provenance | Content media manifest |
| Generation model, URL, prompts, settings, job identifiers, spending evidence | Private `memory/asset-production/`; secrets in ignored recovery file |
| Existing Shopify secrets | Existing server env; never imported by preview |

## Verification boundaries

Use the preview's dedicated build/type/lint tests in addition to reporting the existing monorepo gates. Existing backend failures do not become passing by calling the local preview complete. No real payment, patient information, newsletter submission, or medical advice flow is authorized in this frontend phase. Finder answers stay in component memory and are never put into URLs/analytics/storage. Cart stores product choices only. New content must not repeat the previous fabricated testimonial.

## Same-day research

Checked 2026-09-21. Shared playbook and its source transcripts informed process; archived files are historical reference, not current capability evidence.

- [Hyperice](https://hyperice.com/): inspected page content; product families and direct comparison underpin shopping navigation. No copied imagery or identity. Live motion not yet visually inspected.
- [Oura](https://ouraring.com/): inspected page content; concise benefit sequencing and focused product journey. No inherited health claims.
- [Therabody](https://www.therabody.com/): inspected page content; organize around recovery tasks and tangible devices. No borrowed testimonials.
- [Jitter production account](https://tympanus.net/codrops/2025/09/02/a-behind-the-scenes-look-at-the-new-jitter-website/): motion must be designed with the narrative rather than appended to generic cards.
- [Motion scroll](https://motion.dev/docs/react-scroll-animations), [accessibility](https://motion.dev/docs/react-accessibility): existing installed motion runtime can own bounded scroll transforms; preserve static content and preference changes.
- [OpenRouter image contract](https://openrouter.ai/docs/guides/overview/multimodal/image-generation), [video contract](https://openrouter.ai/docs/guides/overview/multimodal/video-generation): inventory queried directly. Latest precision image model found: GPT Image 2.5 Sunburst; video: Seedance 2.5. Capability and spend evidence stays private. User explicitly authorized these paid routes; existing key cap remains unchanged.
- Blender executable verified: 5.2.1 LTS. Use controlled authored geometry when an exact camera/object relationship matters; generated film remains illustrative.

## Asset plan

Hero: large precision product composition against matching bone, product right/center and clean negative space left. Catalog: consistent isolated equipment concepts. Product inspection: controlled local render or a reviewed Seedance shot, with still fallback. Never describe generated internals as real engineering. Keep originals/editable sources, web variants, and prompt records. Produce a bounded pilot before the rest.
