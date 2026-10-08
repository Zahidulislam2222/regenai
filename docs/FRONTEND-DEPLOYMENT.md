# Frontend and assistant deployment history

## Current combined release — 2026-10-08

The main application serves the Shopify-backed Hydrogen storefront and same-origin Python Support Studio. The assistant release adds matching chat/console styling, encrypted memory, owner approvals, handoff, durable jobs, Shopify renewal and Gmail support-label reads. The latest verified release matched 179 packaged source files, 30 Python runtime files, 97 frontend artifacts, three private environment files and two image identities. Public HTTP checks and restart/read persistence passed. AI is bounded; real refund/email remains disabled. [Build status](BUILD-STATUS.md) records the evidence; [RELEASE.md](RELEASE.md) describes both services’ release and recovery. Earlier sections below are dated historical checkpoints.

## Current release — 2026-10-04

The reviewed Hydrogen storefront is live on [main](https://regenai.zahidul-islam.com) and [staging](https://regenai-staging.zahidul-islam.com). Commit `21e2f0e` includes the approved hero composition plus fixes for responsive hero spacing, reduced-motion controls, Shopify finder copy and search revalidation. The same tested Docker image runs on both hosts. Final local/live checks matched **145/145 main release files** and **144/144 staging release files** plus its archived image; both containers and seven origin routes passed, and cart POST remained HTTP 501. Public browser runs on each host passed motion, finder and search behavior, six mobile/desktop axe scans with zero WCAG A/AA violations or overflow, and ten hero widths with no overlap. The independent source review found no blocking code defect. The products remain project products; public checkout is closed on both hosts, main Account remains closed, and staging Account now exposes a test-only sign-in entry. A complete manual screen-reader journey and live rollback exercise are still due. Older release sections below are historical checkpoints.

Buyer test checkpoint (2026-10-04): a staging-only runtime update enabled the existing Customer Account sign-in entry, with 144/144 local/live file parity plus archived image and no source-image change. Public HTTPS shows staging Account 200 and a Shopify login redirect with PKCE/state and its registered callback; main Account remains 404. Cart POST remains 501 on both. The loopback-only development environment reached Shopify's hosted development-store checkout with a test-only payment gateway, but no order was submitted while explicit approval for an external test-order record is pending. Full buyer login/OTP and logout are not yet verified.

## Current Hydrogen storefront — 2026-10-03

The main site at **https://regenai.zahidul-islam.com** and staging at **https://regenai-staging.zahidul-islam.com** now run the Shopify-backed Hydrogen frontend. Both show the original Pulse One 3D hero. A fresh connected-browser check after the session-key rotation found the scene ready, a canvas present and normal motion enabled on both homepages; two main-site screenshots showed different model positions. The header motion button can pause the scene, and a reduced-motion browser preference shows a still poster. The owner-reported missing-animation view has not yet been reproduced or identified. Ordering and Account remain disabled.

The session-key rotation changed only ignored runtime environment files in versioned releases on the existing VPS. Before mutation, staging and main matched their saved local release hashes. After activation, staging matched 143/143 files plus its image archive and main matched 144/144 files; both active containers passed health, seven origin routes and closed-cart POST 501. The prior release trees remain archived with expired keys and require a fresh rotation before rollback. The historical static release evidence below is preserved as prior-release history.

## Animated hero repair — 2026-10-03

The public storefront at **https://regenai.zahidul-islam.com** now serves the restored Pulse One 3D hero. The 991,864-byte original model had loaded too slowly and revalidated on each visit. A source-pinned replacement keeps the same visible form and moving part, reduces the model to 321,652 bytes, and transfers 144,192 bytes when gzip is accepted. Only the content-versioned model receives a long immutable browser cache header; HTML stays `no-store` and the store remains read-only.

Before activation, the actual public release was snapshotted and matched its saved 29-file manifest. The new versioned static release passed local browser checks, exact remote Nginx-image validation and **31/31** remote file hashes; its container became healthy after activation. Public HTTPS returned the compressed model and noindex headers. Fresh mobile and desktop browsers reached the 3D scene, and canvas frames changed over time; reduced motion retained the still image. All three public views had no page errors or horizontal overflow. The prior release remains available for rollback. Cloudflare currently reports `DYNAMIC` for the model, so this evidence does not establish edge caching or a fixed first-load time. The separate Hydrogen staging site received the same model optimization in a later source-pinned release; its public animated browser and parity evidence is in [build status](BUILD-STATUS.md).

## Updated visual storefront — 2026-10-03

The expanded storefront is live at **https://regenai.zahidul-islam.com**. It adds a visible product hero, compact inspection, category entry points, journal index and three articles, plus a home FAQ. Product pages state that ordering is closed and show no invented prices or purchase controls. The connected Shopify store has no verified RegenAI recovery merchandise, so this release does not enable checkout or establish full-project readiness.

Before promotion, all 28 files in the prior live release matched the saved local manifest. The updated static build was deployed as a separate 29-file versioned release using the existing Compose frontend service; the prior release remains intact. Compose configuration validated, the recreated container reported running/healthy, and all **29/29** uploaded files matched the local SHA-256 manifest after deployment. Public Chrome opened the new article and Pulse One product pages; product assets returned HTTP 200, the product route had no page console errors or purchase control, and its 390px viewport had no horizontal overflow. The local storefront gate results are in [build status](BUILD-STATUS.md). Accessibility rerun, fresh independent review, real commerce and merchant-security gates remain outstanding.

Updated 2026-09-22. The selected new design is available at **https://regenai.zahidul-islam.com**.

This release publishes the standalone visual application: collection browsing, product pages, recovery finder, browser-only bag, informational pages, Blender product assets and Three.js motion. Shopify backend integration and real checkout remain unfinished and paused. application disclosures and search-engine noindex remain enabled.

## Verification

Bounded release criteria: 7/7 met. Independent review approved the frontend, deployment configuration and retained live evidence.

- Dedicated frontend typecheck, lint and production build passed; 24/24 focused recovery tests passed.
- Local and public HTTPS HTTP checks passed for 22 valid/missing routes plus unsupported-method rejection.
- Chrome passed desktop/tablet/mobile widths, 3D initialization, scroll chapters, reduced motion, product navigation, bag persistence and keyboard-focus restoration; no browser exceptions or unexpected external requests.
- Existing hosting uses an isolated nonroot, read-only, resource-limited container on a loopback listener, behind Caddy and Cloudflare. Origin certificate trust and hostname were verified without disabling TLS validation.
- Built assets and deployment tooling passed secret scanning. Python deployment tooling passed Bandit under the existing global policy. No dependencies were added for this release.
- Off-server release archive was extracted and compared successfully. All 28 deployed release files and the installed Caddy site match the local candidate byte-for-byte; existing Caddy configuration was preserved.

This is frontend review evidence, not a claim that the full Shopify project, million-user capacity, uptime objective or production-compliance work is complete.
