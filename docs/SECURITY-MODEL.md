# Security model

Updated 2026-09-24. Related: [SECURITY.md](../SECURITY.md) (vulnerability reporting), [ARCHITECTURE.md](ARCHITECTURE.md), [PRIVACY.md](PRIVACY.md).

> **Status:** controls marked **Verified** were checked on the date shown. Controls marked **Planned** or **Gap** are not in place. Passing a scanner is not a security certification, and no third-party audit or penetration test has been performed.

## 1. What is being protected

| Asset | Why it matters |
|---|---|
| Buyer payment data | Highest impact — **never enters RegenAI systems**; handled only by Shopify-hosted checkout |
| Buyer personal and health-related data (accounts, recovery-finder answers, health flags) | Privacy law exposure; potential special-category data |
| Merchant OAuth access tokens | Grant API access to a Shopify store |
| Merchant app data (review queue, sessions) | Business data, cross-tenant leakage risk |
| Shopify, Cloudflare and GitHub credentials | Full control of infrastructure and deployments |
| Integrity of the storefront code and supply chain | Tampered scripts could skim data or deface the store |

## 2. Threat model (STRIDE summary)

| Threat | Example against RegenAI | Primary controls |
|---|---|---|
| **Spoofing** | Forged OAuth callback or forged Shopify webhook | OAuth and local webhook raw-body HMAC verification; OAuth `state` check; shop-domain validation. Remote delivery verification remains due |
| **Tampering** | Injected script on the storefront; poisoned dependency | Strict Content Security Policy; no third-party scripts; lockfile + Dependabot + SBOM; CodeQL; branch protection |
| **Repudiation** | Merchant disputes an approval in the review queue | Schema has reviewer ID and timestamp columns; decision recording and audit logging planned |
| **Information disclosure** | Cached personalised page served to another buyer; one merchant reading another's data; secrets in logs or Git | Public-only cache policy with isolation tests; per-shop query scoping (gap — see §4); log redaction; secret scanning |
| **Denial of service** | Traffic flood or expensive query abuse | Cloudflare proxy; bounded request methods and body sizes; concurrency limits and load shedding (planned); rate limits (planned) |
| **Elevation of privilege** | Unauthenticated access to merchant admin routes | Per-request session authentication on every admin route (gap — see §4) |

## 3. Controls in place

| Control | Where | Status |
|---|---|---|
| Card data never handled — Shopify-hosted checkout only; Shopify is certified PCI DSS Level 1 ([Shopify](https://www.shopify.com/security/pci-compliant)) | Architecture | **By design** |
| Security headers on live frontend: CSP (`default-src 'self'`, no inline scripts, `frame-ancestors 'none'`, `connect-src 'self'`), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `Cross-Origin-Resource-Policy` | `deploy/frontend/nginx.conf` | **Verified** on live responses 2026-09-24 |
| No third-party scripts, analytics or trackers on the live frontend | Frontend build | **Verified** at release 2026-09-22 (no unexpected external requests in Chrome) |
| Container hardening: non-root, read-only filesystem, dropped capabilities, resource limits, loopback-only port behind Caddy | `deploy/frontend/compose.yaml` | **Verified** at release 2026-09-22 |
| Only `GET`/`HEAD` accepted by the static frontend; dotfiles and unknown assets not served | `deploy/frontend/nginx.conf` | **Verified** at release (22 route cases + `POST` → 405) |
| Minimal access logging (status and method only; no IPs, query strings or referrers written by Nginx) | `deploy/frontend/nginx.conf` | **Verified** in configuration |
| OAuth callback: shop-domain validation, `state` check, HMAC verification | `packages/app/app/routes/auth.callback.tsx` | **Implemented**; atomic state handling is a gap |
| Secrets kept out of Git: `.gitignore` rules and gitleaks in CI | `.gitignore`, `.github/workflows/secret-scan.yml` | **Verified** — staged-diff and full-history scans clean 2026-09-24 |
| Static analysis (CodeQL), SBOM (Syft/CycloneDX), Dependabot weekly updates | `.github/` | **Configured** |
| `main` branch protection: pull request + 1 approving review, linear history, no force-push, no deletion, conversation resolution | GitHub settings | **Verified** via GitHub API 2026-09-24 |
| Server-side logger that redacts private values; public-only bounded cache | `packages/storefront/app/lib/` | **Built** — unit-tested, not yet released |

## 4. Known gaps and release blockers

These are tracked openly. The merchant app and Hydrogen integration **must not be released to real merchants** until the release blockers are closed with tests and independent review. The legacy merchant scaffold remains stored as a Cloudflare Worker, but its production and preview `workers.dev` URLs were disabled on 2026-10-04. Native inventory found no custom domain or zone route; API readback confirmed both route flags false and the former public URL returned HTTP 403. It remains unfit for merchant use until the local security repair is deployed and independently verified.

| ID | Gap | Severity | Required fix |
|---|---|---|---|
| SEC-01 | Existing remote merchant tokens may be plaintext | Release blocker | Local callback encrypts new writes with shop-bound AES-GCM; configure remote secret, rotate legacy tokens and prove remote ciphertext before release |
| SEC-02 | Stored legacy merchant bundle lacks proven per-request auth and shop scoping | Release blocker | Its known public URLs are disabled. Local standalone-app repair uses an expiring opaque browser session and shop-bound list/detail queries; local 401/404 HTTP checks passed. Deploy and independently verify before real use. An embedded app would instead require Shopify ID tokens. |
| SEC-03 | Deployed OAuth `state` previously used eventually consistent KV | Release blocker | Local repair uses browser-bound D1 state consumed by one `DELETE ... RETURNING`; local D1 and negative tests passed. Migrate remote D1 and verify before release. |
| SEC-04 | Historical preview/staging bindings pointed at production D1/KV | Release blocker | Source bindings removed so those environments fail closed; provision and verify isolated databases before preview/staging deployments |
| SEC-05 | HSTS response-header gap | Observed resolved for main/staging | Public HTTPS HEAD checks on 2026-10-04 returned `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` on both frontend hosts. The wider domain/subdomain TLS policy has not been audited. |
| SEC-06 | Fresh 2026-10-04 npm audit after targeted Vitest patch: 0 critical, 45 high, 3 moderate, 3 low in the full development tree; `--omit=dev` reports zero runtime advisories | High | Vitest/coverage 4.1.11 removes their moderate advisory path; PR #20 Linux `npm ci` and unit/browser/accessibility checks passed. Remaining development-tool reachability review, targeted upgrades and a CI gate on new high/critical remain due. |
| SEC-07 | Some CI jobs mask failures (`continue-on-error`, `\|\| true`) | Medium, partially repaired | GraphQL contract codegen/drift and the narrow application-copy red-flag guard passed on PR #20; the guard ran four regression tests and scanned five checked-in JSON sources on Linux. It does not establish regulatory compliance. Percy now shows skipped with its opt-in unset, and no visual specs exist. The scheduled/masked k6 workflow was replaced locally by a manual opt-in with failing prerequisites; GitHub recognition and real bounded scenarios are still due. Exercise actual visual/load coverage before release. |
| SEC-08 | Webhook lifecycle incomplete | Release blocker | Local uninstall and three privacy topics now verify raw-body HMAC and pass D1/HTTP checks. Customer requests queue for authenticated merchant action; redactions are shop-scoped. Remote migrations/subscriptions/delivery proof, stale-install handling, reconciliation and failure recovery remain due. |
| SEC-09 | No rate limiting, audit log or admin MFA enforcement in the merchant app | Planned | Implement per OWASP ASVS Level 2 mapping |

## 5. Security programme — planned

- **Standard:** controls mapped to [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) Level 2, version pinned.
- **Testing:** negative authorization and tenant-isolation tests; CSRF/XSS/SSRF/injection tests; DAST (OWASP ZAP) against staging; dependency and secret scanning on every pull request.
- **Secrets:** stored only in the environment/secret store; rotation procedure per secret; no secrets in logs, URLs or client bundles.
- **Supply chain:** pinned lockfile, SBOM per release, container images pinned by digest, Dependabot with grouped updates.
- **Review:** independent review of every security-relevant change; external penetration test before any real-merchant launch.
