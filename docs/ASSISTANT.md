# RegenAI Support Studio — operator guide

The assistant adds customer chat to the existing storefront and a Python support console at `/assistant`. The collection remains a collection with ordering closed. Public workspaces contain workspace orders; an approved resolution updates only that workspace's encrypted records.

Verified release (2026-10-08): real Claude responses passed Spanish memory/image understanding and the damaged $89 recommendation. The two authorized checks cost $0.01051. AI is active under the configured service budgets; external refunds and email sending remain disabled pending dedicated client connections and end-to-end verification.

## What operates

The Python service maintains browser sessions, explicit saved preferences, conversation history, rulebook versions, recommendations, approvals, human-review bundles, setup notes and a durable queue in encrypted SQLite records. The worker reviews pending tickets, checks connections, imports Gmail messages and applies retention. Record and task capacity are transactionally bounded, public writes are throttled, and exports include complete history within those limits. Recurring work survives service restarts; expired leases are reclaimable. Reads and recommendations may retry with bounded attempts. Financial actions and email sends never automatically retry after an uncertain result.

Claude responses use a configured OpenRouter model, with transactional cost reservations, daily and total service budgets, session limits and no provider retries. Image bytes are sent for analysis without storing the attachment. Browser speech recognition and speech synthesis depend on installed browser voices and services; they are not a server audio-generation API. Allowlisted HTTPS web pages can be retrieved and included as untrusted context in later chat. Multilingual responses come from the model; deterministic policy previews use the maintained example templates.

The customer widget opens an accessible dialog and connects to the same-origin service. The larger console supports ticket review, image chat, voice controls, explicit memory, policy editing, historical-email drafts, scheduling/cancellation, integration diagnostics, audit exports and client setup records. The theme synchronizer derives the shared palette and fonts from the existing storefront. Font licenses ship alongside the assets.

## Exact live-action boundary

Workspace records never trigger external calls. Real tickets require owner access, configured Shopify and inbox credentials, authoritative order/customer matching and active rulebook eligibility. The owner approves the exact ticket version, reply, recipient and amount. A changed policy or concurrent action invalidates or blocks execution. The current financial adapter supports configured USD orders and a verified successful payment transaction; other currencies and unsupported payment combinations require human review.

Before a real refund, the service checks the authoritative Gmail sender or Zendesk requester. It holds an order-level lock across network calls, records the refund receipt before sending the reply, and quarantines ambiguous results for reconciliation without retry. A crash after claim also holds the ticket/lock for reconciliation. Do not blindly clear a lock: compare Shopify transactions and the inbox sent history, record the outcome and arrange a new recommendation only after an operator verifies what happened. This release does not provide unattended financial execution.

Sensitive or uncertain recommendations create an internal human-review queue entry with ticket, matched order, transcript and complete audit context. The console exposes that queue through the handoff state and downloadable bundle. No external staff notification or staffed SLA is implied.

## Connections and least privilege

| Service | Implemented capability | Client prerequisite |
| --- | --- | --- |
| Shopify | OAuth installation, read diagnostics, order lookup, approved refund adapter | Dedicated support app, appropriate order access and protected-customer-data permission |
| Gmail | OAuth, refresh, bounded inbox import, verified approved reply | Google client configured for the exact HTTPS callback; Gmail read/send consent |
| Zendesk | Read diagnostics, verified requester and approved public reply | Correct account URL and suitable OAuth token |
| Gorgias, Help Scout, Front, Zoho Desk | Bounded read and connection checks | Own provider credentials; outbound execution remains disabled |
| Google Calendar | OAuth, refresh, recent events read | Calendar read consent |
| GitHub | Repository read | Restricted token for required repositories |
| Slack | Authentication read check | Restricted bot token; message delivery is not enabled |

The existing project Shopify token was verified read-capable but lacks `write_orders` and has unrelated scopes. It is not a least-privilege support token. Do not enable refunds with it. Create a separate Shopify support app instead of expanding or reusing unrelated merchant permissions. Request only necessary scopes; historical orders beyond the ordinary window require separate approved access. Keep `ASSISTANT_LIVE_ACTIONS_ENABLED=false` until the dedicated installation and test-store workflow pass.

The owner console provides encrypted manual token setup. Browser OAuth routes are `/assistant/oauth/shopify/start?shop=<canonical-shop-domain>`, `/assistant/oauth/gmail/start` and `/assistant/oauth/calendar/start`; each requires an owner browser session. Register their matching `/callback` URLs in the provider console. State is browser-bound, expiring and single-use; Shopify callbacks additionally require the app's HMAC signature. Configuration alone is not evidence of completed consent.

If a connection says “token expired,” identify the provider and token type first. Check expiry metadata, clock, current app installation/revocation and scopes; attempt the documented refresh only for a refreshable token. A 401 on a refund/send never prompts an automatic repeat. Check execution receipts and provider history before reconnecting or retrying. Do not ask clients to disclose their store password: use delegated staff access, official consent and a dedicated secret store.

## Client installation and paid trial

1. Agree on policies, channels, data retention, refund limits and the named human escalation owner. Use a test store and workspace orders first.
2. Install the dedicated Shopify app and selected inbox connection with owner consent. Run read diagnostics before enabling any write behavior; record results in Activity & client setup.
3. Install the assistant package in a private Python environment on the client's computer. Configure the MCP bridge using the [Claude client instructions](../services/assistant/client/INSTALL.md), separate recommendation token, support skill and example rulebook.
4. Review anonymized historical support emails. Generate a voice/policy draft; manually validate exceptions and activate an explicit rulebook version. Unknown policy starts with no authorized refund reasons.
5. Rehearse the damaged-item, sensitive-case, rejection, changed-policy and duplicate-approval scenarios. Join the first real owner-led sessions only after a test-store refund and test-inbox reply have been verified.
6. Export the setup log to the client's private records. Record granted scopes, verified connection status, policy approval, device setup, escalation route, spending limits, backup/restore and the next review date. Never put tokens in setup notes or recordings.

For the trial walkthrough: introduce the actual project honestly, open the damaged $89 workspace ticket, inspect the matched order/rulebook, prepare the recommendation, approve it, show the audit and demonstrate the second approval being refused. Then show sensitive-case handoff, token-expiry diagnostics and the setup record. Show that approval records are local and no refund or customer email was sent. A narrated Loom, hourly rate, English fluency, NDA signature and 9am–1pm US Central availability are applicant deliverables; this software does not establish those personal facts.

## Configuration, privacy and recovery

All `ASSISTANT_*` runtime variables are represented in the typed settings layer and `.env.example`. Provider URLs, API versions, model, token prices, budgets, limits, ports and storage paths come from that boundary. Prompts, Store policy, connector registry and UI copy are maintained data files. Protocol field names and HTTPS scheme syntax are intentionally fixed. Keep the OpenRouter key's existing cap unchanged.

The private project recovery file contains actual secrets; it is ignored by Git. The dossier and checkpoint index retain verified decisions and evidence. Save encryption keys separately from encrypted data backups: losing the key makes records unreadable. Use SQLite's backup API for a consistent snapshot of the WAL database. A restored budget ledger preserves prior usage and uncertain reservations. Do not reset it to bypass a cap.

Public workspaces retain data for the configured retention period and cookie duration. Erase conversation deletes messages, saved preferences and retrieved chat context; ticket audit/history remain for accountability. Merchant operational records persist until the owner performs a documented retention/export process. The encrypted database still exposes structural metadata such as record categories, scope IDs and timestamps. This is an isolated single-merchant deployment, not a multi-client SaaS: provision a separate deployment, encryption key, owner password and database for each client.

## Release and rollback

Keep local source authoritative. Snapshot the active source/routing before editing, run Python and existing JavaScript tests/type/lint/security/build gates, and exercise the actual browser/HTTP flow. A separate review session checks the criteria and diff. Build immutable images locally, save image/source manifests, verify upload hashes, test loopback candidate readiness, then change only this project's routing. Confirm deployed image identity and every packaged source/static hash after release.

The Compose service uses a non-root UID, read-only root filesystem, dropped capabilities, constrained resources, private writable data volume and restart policy. Worker failure causes the service to exit for restart; health requires a fresh worker heartbeat. A running deployment supports continuous operation but is not proof of measured 24/7 uptime. Keep the prior release and routing snapshot for rollback, and preserve the durable database and key. Confirm compatibility before rolling back schema changes. Never restore expired storefront session keys from old releases.

Official references: [Shopify refund API](https://shopify.dev/docs/api/admin-graphql/latest/mutations/refundCreate), [Shopify authorization](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant), [Gmail sending](https://developers.google.com/workspace/gmail/api/guides/sending), [Zendesk tickets](https://developer.zendesk.com/api-reference/ticketing/tickets/tickets/), [Claude Desktop MCP setup](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop), [MCP transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
