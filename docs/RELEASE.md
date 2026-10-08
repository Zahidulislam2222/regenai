# Release, rollback and recovery

Updated 2026-10-08. This procedure covers the Hydrogen frontend and Python assistant on the existing host. It does not authorize new paid infrastructure, live financial actions or third-party load testing.

## Local-first release

1. Define acceptance and capture a failing check for behavior changes. Read the current release/configuration and native platform inventory. Hash active source, routing, images and environment against the last local release; reconcile live-ahead drift locally before editing.
2. Edit local source and its typed configuration or maintained data. Update the private project dossier first, then public docs. Keep credentials and infrastructure recovery records out of tracked files.
3. Run tests, type checks, lint, security scanners and build. Verify any new dependency in its real registry. Review the diff independently against the criteria; report missing gates rather than waiving them.
4. Commit under the maintainer's verified Git identity with security hooks enabled. Fast-forward the authorized branch, publish the pull request and verify remote SHA/checks. Main requires one independent approval; preserve that protection.
5. Freeze an immutable package: source manifest, exact image identities, runtime artifact hashes, environment hashes and approved routing diff. Keep a compatible previous release and consistent database snapshot. Reuse an image only when its complete runtime inputs are unchanged and hash-verified.
6. Recheck live drift, health and unused candidate ports immediately before upload. Test the candidate with a consistent on-host encrypted database snapshot, preserving its budget ledger. Keep customer data on the host. During promotion stop the isolated candidate worker and prior authoritative worker, select the original data mount, restart the reviewed service and verify health before routing. Retain one authoritative worker; record the bounded support cutover interruption.
7. Promote only the reviewed Caddy site snippet, validate shared routing and health, then verify public routes, storefront rendering, owner login, private/no-store headers, closed-ordering behavior and read-only integration diagnostics. Do not invoke paid AI or real refund/send during routine release smoke.
8. Prove local/live parity for every uploaded source file, both image/runtime artifacts, private environment, Caddy and effective settings. Record counts/hashes privately; public documents report scoped outcomes. Preserve all rollback artifacts and avoid global Docker cleanup.

## Rollback

If promotion fails, stop the candidate worker, start the previous worker with its compatible environment, wait for both previous services to become healthy, then restore routing. Recheck public HTTP behavior, credentials and parity. This order keeps one authoritative worker. A prior release with expired secrets needs rotated compatible values first.

Never undo a completed refund, send or database migration by selecting an old image. Inspect schema compatibility and provider receipts. Preserve claimed/ambiguous action locks and reconcile provider history before permitting another action. Retain audit and AI budget records.

## Data and secret recovery

Use SQLite's online backup API for a consistent WAL snapshot. Verify integrity on the host; customer records must not be downloaded casually. Keep approved encrypted off-host backups and the corresponding encryption keys in separate recovery storage before claiming host-disaster recovery. Test restoration into an isolated deployment and record measured RPO/RTO. Current single-host backup integrity is not proof of independent-host recovery.

Owner credentials, delegated grants, CI secrets and encryption keys have separate rotation/revocation procedures. Re-consent Google Testing grants after expiry. Review Shopify installation/scopes before renewal. Never reset the ledger to bypass spending limits.

## Documentation synchronization

After verified GitHub publication, inspect the existing public Google Doc. Update needed sections in place with revision-aware changes; preserve unique content, styles and tabs. Export the same document as PDF to a temporary private path and validate content/pages before replacing the canonical local PDF. If update/export fails, keep the last known-good PDF.

## Pipeline boundaries

Python CI runs tests, Ruff, mypy, Bandit and a wheel build without paid provider credentials. Existing JavaScript, browser, contract and secret checks remain applicable. Optional Workers production deployment requires manual dispatch, repository opt-in and confirmation; branch publication alone cannot activate it. Paid visual/load integrations remain separately gated.

Standard hosted runner compute is free for public repositories; larger runners and storage can incur charges. No new artifact upload or enlarged cache allowance is introduced by the assistant workflow. [GitHub billing documentation](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

[Build evidence](BUILD-STATUS.md) · [Reliability](RELIABILITY.md) · [Security](SECURITY-MODEL.md)
