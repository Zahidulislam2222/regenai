# Defect log

| Escaped defect | Gate that should have caught it | Gate added? |
|---|---|---|
| Direct page load focused main before the first Tab, skipping the skip link in desktop and mobile browsers. | Keyboard browser check on the built Hydrogen route, including first Tab and focus after client navigation. | Yes — both assertions now run in Playwright; 12/12 local E2E passed on 2026-10-03. |
| E2E and accessibility CI could skip for absent Shopify secrets, target an older preview, or allow axe failures. | CI must build and test the checked-out candidate and propagate browser-test failures. | Local runner and workflows updated; fake-settings E2E 12/12 and axe 22/22 passed on 2026-10-03. Linux GitHub-runner execution still pending. |
| Reduced-motion visitors saw an Enable motion button that could not override their system preference. | Built-browser check with reduced motion enabled and control visibility asserted. | Yes — local browser check confirms animation stays paused and the misleading button is absent. |
| The live Shopify finder described a three-question flow that only exists in the static fixture preview. | Content acceptance check against the selected catalog source in the built storefront. | Yes — source-specific metadata and journal copy have unit and local browser checks. |
| Typing in search repeated Shopify catalog validation through the collection and layout loaders. | Network request count during a real search interaction. | Yes — route revalidation unit tests and a local browser assertion report zero same-route data requests. |
| The approved hero design placed its product label over the footer line at several desktop widths. | Real layout-box overlap check across breakpoints, beyond mobile and full desktop screenshots. | Yes — packaged browser checks at ten widths found no overlap. |
