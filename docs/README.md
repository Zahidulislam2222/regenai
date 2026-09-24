# RegenAI documentation

Start with the [project README](../README.md), then use this index.

## Understand the system
| Document | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, frontend/backend split, trust boundaries, hosting, repository map |
| [adr/](adr/) | Architecture decision records (historical decisions and their context) |
| [BUILD-STATUS.md](BUILD-STATUS.md) | What is verified today and which gates are open |
| [ROADMAP.md](ROADMAP.md) | Milestones and phases |
| [CHANGELOG.md](CHANGELOG.md) | Notable changes |

## Operate and scale
| Document | What it covers |
|---|---|
| [SCALABILITY.md](SCALABILITY.md) | Capacity model and path from 10k to 1M+ concurrent users |
| [WORKLOAD-CONTRACT.md](WORKLOAD-CONTRACT.md) | Load-test definitions, safety limits and evidence rules |
| [RELIABILITY.md](RELIABILITY.md) | 99.9% availability target, SLIs, error budget, disaster recovery, incident response |
| [FRONTEND-DEPLOYMENT.md](FRONTEND-DEPLOYMENT.md) | Live frontend release evidence |
| [FRONTEND-REVIEW.md](FRONTEND-REVIEW.md) | Frontend acceptance criteria and test results |
| [FRONTEND-SPEC.md](FRONTEND-SPEC.md) | Frontend specification |
| [../deploy/frontend/README.md](../deploy/frontend/README.md) | Container, routing, headers, release and rollback procedure |

## Security, privacy and law
| Document | What it covers |
|---|---|
| [../SECURITY.md](../SECURITY.md) | How to report a vulnerability |
| [SECURITY-MODEL.md](SECURITY-MODEL.md) | Threat model, controls in place, known gaps and release blockers |
| [PRIVACY.md](PRIVACY.md) | Live demo privacy notice and platform data map |
| [COMPLIANCE.md](COMPLIANCE.md) | PCI DSS, GDPR, US state privacy, health-product, consumer and accessibility law overview |
| [PRODUCTION-APPLICABILITY.md](PRODUCTION-APPLICABILITY.md) | Detailed applicability register with official sources |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | WCAG 2.2 AA target, tested scope, known limitations |

## Engineering process
| Document | What it covers |
|---|---|
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Setup, branch and commit conventions, required checks |
| [AI_GOVERNANCE.md](AI_GOVERNANCE.md) / [AI-WORKFLOW.md](AI-WORKFLOW.md) | How AI coding assistants are used and reviewed in this project |
| [../PROJECT_PLAN.md](../PROJECT_PLAN.md) | Master plan: task contracts, dependencies and acceptance criteria |

## Status labels used across these documents
**Live** — deployed and verified · **Built** — in source with local test evidence, not released · **Partial** — known gaps or failing gates · **Planned** — designed, not implemented · **Not measured** — no evidence yet
