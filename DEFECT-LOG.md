# Defect log

| Escaped defect | Gate that should have caught it | Gate added? |
|---|---|---|
| Direct page load focused main before the first Tab, skipping the skip link in desktop and mobile browsers. | Keyboard browser check on the built Hydrogen route, including first Tab and focus after client navigation. | Yes — both assertions now run in Playwright; 12/12 local E2E passed on 2026-10-03. |
| E2E and accessibility CI could skip for absent Shopify secrets, target an older preview, or allow axe failures. | CI must build and test the checked-out candidate and propagate browser-test failures. | Local runner and workflows updated; fake-settings E2E 12/12 and axe 22/22 passed on 2026-10-03. Linux GitHub-runner execution still pending. |
