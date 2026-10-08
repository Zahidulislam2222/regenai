# RegenAI support assistant acceptance contract

The assistant extends the existing Shopify project with a Python service and a browser interface. It supports continuous background operation and an owner-supervised support workflow. Approval is required before financial or outbound communication actions. A running service is not evidence of measured 24/7 uptime.

## Required behavior

| Area | Acceptance |
| --- | --- |
| Conversation | Natural-language answers, persistent session isolation, multilingual replies and explicit memory deletion. |
| Support | Inspect ticket and authoritative order data, use the current store rulebook, recommend a resolution, obtain approval, execute once and attach full audit/history to handoffs. |
| Merchant policy | Versioned editable rules and voice; draft policies from supplied historical email examples, with owner review before activation. |
| Operations | Durable scheduled work, retries, restart recovery, readiness, bounded costs and setup/incident logs. |
| Connections | Least-privilege Shopify and inbox connectors; expiring-token recovery and integration diagnostics. Unconfigured services stay disabled. |
| Multimodal | Image understanding, live-web retrieval and voice/media adapters with truthful availability indicators. |
| Delivery | Claude installation guide, MCP tools, skill/rulebook files, per-client setup record and a reproducible walkthrough. |
| Security | Server-only credentials, authorization and isolation on every endpoint, same-origin mutation protection, bounded inputs, encrypted private records and no secret logging. |
| Release | Tests, type/lint/security/build gates, real HTTP/browser flows, independent review, pre-deploy drift snapshot, rollback and local/live hash parity. |

## application boundary

workspace orders and tickets may demonstrate the complete approval workflow. They must never be described as actual Shopify refunds or sent customer email. Real Shopify/inbox execution requires configured credentials, the appropriate scopes, a bound approval and an auditable authoritative order lookup. Unknown policy and sensitive cases go to a human.

## Human role requirements

The software cannot establish the applicant's English fluency, actual admin experience, NDA signature, desired rate or availability for 9am–1pm US Central calls. The delivery documentation must support the paid-trial setup and Loom walkthrough without inventing those facts.
