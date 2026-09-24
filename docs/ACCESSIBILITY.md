# Accessibility statement

Updated 2026-09-24. Applies to the live demo at `https://regenai.zahidul-islam.com` and the storefront source in this repository.

## Standard

RegenAI targets **WCAG 2.2 Level AA** ([W3C](https://www.w3.org/TR/WCAG22/)). This is an engineering target. No formal conformance audit has been performed, so no conformance claim is made.

## What has been tested

| Check | Result | Date |
|---|---|---|
| Automated axe-core WCAG A/AA scans on home, catalog, bag, product, finder, finder result and mobile states | 0 violations | 2026-09-21 |
| Keyboard operation: dialog and bag open/close with Escape; focus returns to the triggering control | Pass | 2026-09-22 |
| Reduced motion (`prefers-reduced-motion`): 3D and scroll animation replaced with still views; all inspection content remains visible | Pass | 2026-09-22 |
| Responsive layout at 390, 768 and 1440 px: no horizontal overflow or missing images | Pass | 2026-09-22 |
| 3D model failure: product still image shown instead | Pass | 2026-09-21 |

Tests ran in Chromium/Chrome on desktop. Details: [FRONTEND-REVIEW.md](FRONTEND-REVIEW.md) and [FRONTEND-DEPLOYMENT.md](FRONTEND-DEPLOYMENT.md).

## Accessibility features

- Semantic landmarks and headings; skip link to main content
- Visible focus indicators; focus trapped in and restored from dialogs
- Motion can be paused; reduced-motion preference respected
- Text alternatives and still-image fallbacks for 3D product views

The separate `@regenai/ui` design system (not used by the live demo) builds most of its interactive components on Radix primitives with ARIA semantics.

## Known limitations

- No manual screen-reader testing yet (NVDA, JAWS, VoiceOver, TalkBack).
- No testing in Safari, Firefox or on low-end mobile devices.
- 200% and 400% zoom/reflow not yet formally verified.
- Checkout is Shopify-hosted and will be assessed separately once integrated.
- Interactive 3D content may be harder to use with some assistive technologies; equivalent product information is provided in text.

## Planned

Manual screen-reader journeys across the full shopping flow, zoom/reflow checks, contrast verification of all states, and automated axe checks in CI with failing thresholds.

## Feedback

If you find an accessibility barrier, please [open an issue](https://github.com/Zahidulislam2222/regenai/issues/new?template=bug_report.md) describing the page, what you were trying to do and the assistive technology you use.
