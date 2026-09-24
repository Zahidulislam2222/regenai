# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through the contact options on the maintainer's [GitHub profile](https://github.com/Zahidulislam2222), with the subject "RegenAI security". Once GitHub private vulnerability reporting is enabled for this repository, you can also use **Security → Report a vulnerability**.

Include, where possible:

- the affected component (storefront, merchant app, Shopify Function, deployment configuration, CI)
- steps to reproduce or a proof of concept
- the impact you believe it has
- any suggested fix

What to expect:

| Step | Target |
|---|---|
| Acknowledgement | within 3 business days |
| Initial assessment and severity | within 7 business days |
| Fix or mitigation for confirmed high/critical issues | as fast as practical; status updates at least every 14 days |
| Credit | offered in the advisory unless you prefer to stay anonymous |

This is a portfolio project maintained by an individual; there is no bug bounty.

## Scope

In scope:

- source code in this repository
- the live demo at `https://regenai.zahidul-islam.com`
- the merchant-app development deployment on `workers.dev` (known gaps are listed in [SECURITY-MODEL.md](docs/SECURITY-MODEL.md#4-known-gaps-and-release-blockers); reports of new issues are welcome)
- CI/CD workflow configuration in `.github/`

Out of scope:

- Shopify, Cloudflare and GitHub platforms themselves (report to those vendors)
- denial-of-service or load testing against the live demo
- social engineering, physical attacks, or findings requiring a compromised device
- automated scanner output without a demonstrated impact

Please test only against your own accounts and data. Do not access, modify or delete other people's data, and stop and report as soon as you confirm an issue.

## Supported versions

| Version | Supported |
|---|---|
| `main` branch and the live demo | Yes |
| Feature branches and historical commits | No |

## Security documentation

- [Security model and threat analysis](docs/SECURITY-MODEL.md) — controls in place, known gaps and release blockers
- [Privacy and data inventory](docs/PRIVACY.md)
- [Compliance overview](docs/COMPLIANCE.md)
- [Reliability and incident response](docs/RELIABILITY.md)
