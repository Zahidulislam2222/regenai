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
| **Spoofing** | Forged OAuth callback or forged Shopify webhook | HMAC verification of OAuth callbacks (implemented) and webhooks (planned); OAuth `state` check; shop-domain validation |
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

These are tracked openly. The merchant app and Hydrogen integration **must not be released to real merchants** until the release blockers are closed with tests and independent review. A development scaffold of the merchant app is currently deployed to a `workers.dev` URL; its review queue was empty when checked on 2026-09-24. It must be secured or taken offline before any real store installs it.

| ID | Gap | Severity | Required fix |
|---|---|---|---|
| SEC-01 | Merchant OAuth access tokens are stored without the application-level encryption described in the schema comment | Release blocker | Encrypt tokens at rest (AES-GCM, key in secret store, rotation procedure) and test that no plaintext token is persisted |
| SEC-02 | Merchant admin review route has no per-request authentication and no shop scoping | Release blocker | Authenticate every request with Shopify session tokens; add shop predicate to every query; negative unauthenticated and cross-tenant tests |
| SEC-03 | OAuth `state` stored in Workers KV, which is eventually consistent — read-then-delete is not atomic | Release blocker | Move one-time state to a strongly consistent store (e.g. Durable Object or D1 transaction) |
| SEC-04 | Preview, staging and production share the same D1/KV bindings | Release blocker | Separate resources per environment; never run migrations against shared data |
| SEC-05 | `Strict-Transport-Security` header not present on live frontend responses | Medium | Enable HSTS at the edge after confirming all subdomains serve HTTPS |
| SEC-06 | Dependency advisories: at the last audit (2026-09-21) 0 critical, 45 high, 13 moderate, 5 low, many in development tooling | High | Reachability review; targeted upgrades; CI gate on new high/critical |
| SEC-07 | Some CI jobs mask failures (`continue-on-error`, `\|\| true`) | Medium | Remove masks so a red check means a real failure |
| SEC-08 | No webhook intake yet; HMAC verification, idempotency and replay protection must be built with it | Planned | Implement with raw-body HMAC verification and tests |
| SEC-09 | No rate limiting, audit log or admin MFA enforcement in the merchant app | Planned | Implement per OWASP ASVS Level 2 mapping |

## 5. Security programme — planned

- **Standard:** controls mapped to [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) Level 2, version pinned.
- **Testing:** negative authorization and tenant-isolation tests; CSRF/XSS/SSRF/injection tests; DAST (OWASP ZAP) against staging; dependency and secret scanning on every pull request.
- **Secrets:** stored only in the environment/secret store; rotation procedure per secret; no secrets in logs, URLs or client bundles.
- **Supply chain:** pinned lockfile, SBOM per release, container images pinned by digest, Dependabot with grouped updates.
- **Review:** independent review of every security-relevant change; external penetration test before any real-merchant launch.
