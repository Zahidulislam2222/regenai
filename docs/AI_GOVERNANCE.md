# AI Governance — RegenAI

Last updated: 2026-04-20 (Day 1)

Records how AI tooling is used on the RegenAI project: what tools are in play, what each is allowed to touch, what it isn't, and how human judgment gates shipping. Complements [`AI-WORKFLOW.md`](./AI-WORKFLOW.md) which is the running log of prompts, velocity, and session notes. Governance = rules. Workflow = what happened.

**This is explicitly a multi-assistant project — contrast with Kindred Grove (single-assistant by design).** The multi-assistant posture is chosen to close Anderson Collaborative JD tool-skill tags (Cursor, Codex, Copilot) with real, reviewed evidence rather than unused subscriptions.

---

## 1. Tools in use

| Tool | Role | Access | Budget |
|---|---|---|---|
| **Claude Code (Opus 4.7, Max 5×)** | Primary orchestrator. Authors code, docs, ADRs, CI workflows, schema, tests. Runs bash + git + gh + shopify + wrangler + gcloud locally. | Full project filesystem + local shell. Cannot access browser sessions, Shopify admin UI, Partners Dashboard, cloud billing UIs. Cannot self-merge PRs or delete tags. | Max 5× plan window (5-hour rolling) |
| **Shopify Dev MCP** | Knowledge layer for Claude Code. Provides current Liquid filter reference, GraphQL schema, theme-check rules, Admin API scope catalog, Function templates. | Read-only against Shopify's public docs + schema. | No rate limit concerns at build scale |
| **Cursor (Pro)** | Secondary pair — used for Tab-complete on React components, Composer sessions for small multi-file refactors, Agent mode for bounded tasks Claude Code delegates. | IDE-local. No shell access beyond user-invoked commands. | Cursor Pro monthly subscription |
| **GitHub Copilot** | Inline IDE completion in JSX/TS/Rust. Not used to author full files. | IDE-local. | Copilot Individual subscription |
| **OpenAI Codex (via ChatGPT)** | Reasoning-heavy prompts where Claude's tokens are better spent elsewhere — schema queries, refactor strategy brainstorming, occasional debug. | Via ChatGPT app. No direct filesystem / shell. User copies + pastes relevant context in and out. | ChatGPT Plus subscription |
| **Claude Design** (research preview) | Brand-system generation (Day 1 only; output committed to `docs/design-system/brand-tokens.json`). No ongoing role after Day 1 unless brand refresh. | Via Claude.ai app with Design feature enabled. | Included in Max plan |

**No other AI tools are wired into this repo.** Not v0, not Magic, not Bolt, not Replit Agent, not Cody, not Tabnine, not Mintlify/Inkeep, not any browser-agent. Scope is deliberately bounded to the six above. Adding a seventh requires an ADR.

---

## 2. What Claude Code is allowed to do

- Read any file in the repository.
- Write or edit any file in the repository *except* the four gitignored confidential docs (`docs/SOW.md`, `docs/BRAND-BRIEF.md`, `docs/BUILD-LOG.md`, `docs/CI-SECRETS.md`, `docs/RESUME.md`) without explicit user sign-off per commit touching those files.
- Run `npm run lint`, `npm run typecheck`, `npm run test:*`, `git status`, `git diff`, `git log`, and any read-only / local-only command on the global settings.json allowlist.
- Run `git commit`, `git tag`, `git push` against `origin` when the user has explicitly authorized the commit in-session (task was scoped, work product was reviewed either inline or via file read).
- Call the Admin API for the RegenAI Plus Dev Store via `SHOPIFY_ADMIN_API_TOKEN` for documented purposes: product seeding, metaobject provisioning, reading store data during scaffolding, validating scope requirements.
- Call public Shopify APIs (Storefront API, Search & Discovery, Customer Account) from within code it writes.
- Deploy to Oxygen dev / staging via Shopify CLI. Deploy to Cloudflare Workers dev / staging via Wrangler.

---

## 3. What Claude Code is NOT allowed to do without explicit user approval

- Merge a pull request (required-reviews protection on `main`).
- Push a `--force` or `--force-with-lease` (blocked by global `~/.claude/settings.json` deny list + branch protection).
- Delete a tag.
- Delete a repo (`gh repo delete` blocked by deny list).
- Delete a GCP project (`gcloud projects delete` blocked by deny list).
- Run `gcloud billing *` — blocked by deny list AND money-safety rule.
- Run `terraform apply` / `terraform destroy` — blocked by deny list.
- Run `rm -rf` — blocked by deny list.
- Deploy to **production** Oxygen or production Cloudflare Worker (gated by GitHub environment required-reviewer rule).
- Install a new top-level runtime dependency without documented rationale. (The storefront ships unbundled; adding `react-toastify` would require an ADR evaluating it vs `@regenai/ui` Toast.)
- Change branch-protection settings.
- Change the scope of a Shopify custom app.
- Purchase, subscribe, or enable billing on any service. Any paid action halts with ⚠️ banner per global rule.
- Send email, post to Slack, use any outbound integration outside documented API calls.

When in doubt, Claude Code asks. The user has explicitly stated: *"sometimes I accept yes without knowing"* — so the agent must make money-related and destructive actions unmissable, not rely on confirmation popups.

---

## 4. What Cursor / Copilot / Codex are scoped to

**Cursor:** inline completion and Composer sessions inside `packages/storefront/app/` and `packages/ui/`. Does NOT author new routes, new workflows, new ADRs — those are Claude Code's orchestration surface. Commit trailer when Cursor did substantive work:
```
AI-assisted: cursor — <scope>
```

**GitHub Copilot:** inline completion only. Not used to author full components. Accept-rate target ≥40% on JSX/TS, ≥30% on Rust Functions. Substantive contributions flagged via:
```
AI-assisted: copilot — <scope>
```

**Codex (ChatGPT):** reasoning brainstorms. The user pastes a narrow context in, gets a response, pastes reasoning output back into Claude Code for implementation. Codex does NOT author code that gets committed directly — the hand-off is always through human + Claude Code. Flagged via:
```
AI-assisted: codex — <scope>
```

**Claude Design:** Day 1 brand-system generation only. No ongoing role unless a brand refresh is scoped (ADR required).

---

## 5. Human review boundary

Every AI-assisted diff is read by a human before it merges.

- **Author** (Zahidul Islam, solo): reads every commit's diff before `git push`.
- **Reviewer** (Zahidul Islam, self-review for solo; for multi-person future work a separate reviewer): reads the PR diff before merging.
- **High-risk surfaces** require additional read-through:
  - `server.ts` and any CSP / security-header configuration
  - Shopify Functions (`packages/functions/**`) — cart, checkout, pricing, discount
  - Custom app auth paths (`packages/app/**/auth.*`)
  - Customer PII handling (none in Phase 1, but scaffolded for Phase 2+)
  - Compliance-as-code CI rules (`.github/workflows/compliance-lint.yml`) — FDA claim linter, DSHEA validator
- **No auto-merge on AI-authored PRs, ever.** Even when CI is green.

---

## 6. Commit trailer convention

Every commit where Claude Code wrote any substantive portion of the diff (code, docs, commit message, plan) ends with:
```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Substantive contributions from secondary assistants add an additional trailer:
```
AI-assisted: <tool> — <scope phrase>
```

Trivial one-line fixes typed by the human directly don't need trailers.

---

## 7. Prompt logging

Non-trivial prompts (new component, new workflow, new ADR, cross-cutting refactor) are logged in [`AI-WORKFLOW.md`](./AI-WORKFLOW.md) with:
- Prompt intent (one sentence)
- What the assistant produced on first try
- What the human corrected
- Velocity estimate ("this would have taken ~Xh hand-coded")

The Day-45 case study narrative draws from this log. Vague "AI built it" claims are disallowed — concrete before/after evidence required.

---

## 8. Where AI is weakest (honest)

Recorded so Claude Code flags these up-front in future work and doesn't silently muddle through:

1. **Shopify platform quirks that only a real store exercises.** Example carried over from Kindred Grove: headless-browser `/cart/add.js` 401 on password-protected dev stores. Hydrogen sidesteps this (uses Storefront API `cartLinesAdd`), but analog issues will surface — e.g., Markets-specific JWT cookies, B2B company-context session handling. Flag when tests begin surfacing platform behaviour we didn't anticipate.

2. **Merchant-facing UX intuition for non-theme-editor surfaces.** Hydrogen has no theme customizer — the merchant story is admin-UI + PR-based. This is a UX inversion relative to Shopify's Liquid conventions. Assistants can write schema that satisfies theme-check or Storefront type checks; whether a merchant editing a Sanity document feels correct is a separate, harder judgment. MERCHANT-GUIDE.md (Day 20) is where this gap closes — budget dedicated human review.

3. **Multi-tool output reconciliation under time pressure.** When Cursor, Copilot, and Codex all touch the same file across hours, patterns drift. The fix: explicit Task tracking (TaskList tool) + per-task commits + single reviewer pass per-task.

4. **Anti-pattern detection in regulated-niche code.** FDA class II device messaging, DSHEA disclaimers, contraindication UI — there's no "compile error" for a subtly illegal claim. Compliance-as-code CI (Day 41) catches regex-level violations. Clinician review workflow (Day 20) catches semantic violations. Neither catches clever-but-wrong wording. Human legal/compliance review is the final backstop — assistants are not to be trusted here.

5. **Token-efficient delegation between Claude Code and Codex.** Not a blocker, but a practice: some reasoning-heavy tasks cost more Claude tokens than a single Codex session. Decision heuristic: if the prompt is 2000+ tokens of repo context and asks for a design choice not implementation, route to Codex first, implement in Claude Code second.

---

## 9. Data handling

- No real customer PII handled in Phase 1. Mock.shop initially, then real Plus Dev Store with test/seed data only.
- Phase 2 community platform + HealthKit integration introduces the first real health-data surface — HIPAA-ready architecture scoped in `docs/COMPLIANCE.md` (Day 20+ Phase 2).
- Tokens that land in chat during provisioning (Day 0) are dual-written to GitHub Secrets + local `.env` in the same turn per feedback-memory rule, then the temp file is deleted.
- Model outputs are not logged to any external service beyond Anthropic's own training-data-exclusion-by-default policy for API usage. See Anthropic's usage policies and the project's Anthropic account settings for enforcement status.
- Shopify Admin API token, Supabase service-role key, Sanity Editor token, Klaviyo private key, Sentry auth token, Percy token, npm access token — all scoped to RegenAI only; rotation reminders set for project-end (Day 105 + 30).

---

## 10. Escalation path

If an AI-assisted change introduces a real bug that reaches production:

1. **The human author owns the bug, not "Claude did it."** The review gate (§5) is the human's responsibility.
2. Root-cause the miss: prompt gap? Review gap? An area flagged in §8 as known-weak?
3. Update AI_GOVERNANCE.md or AI-WORKFLOW.md to prevent the class of miss.
4. If miss was in Cursor/Copilot/Codex output: tighten the scope in §4 for that tool. First instinct should be tool-scope restriction, not blanket "less AI."

Example from Day 1: When `rm -rf` got attempted reflexively after the Hydrogen CLI crash, the global deny list stopped it. Post-incident: the existing deny list was correct; the fix was to the *reasoning path* (inspect first, destroy second) via the session note in AI-WORKFLOW §6.

---

## 11. Portfolio honesty

The Day-45 case-study site documents AI usage concretely:

- Actual prompts (redacted of any real client detail — not applicable since RegenAI is fictional, but the principle holds for future real-client work).
- Actual velocity comparison — hand-coded Day-1 baselines vs AI-assisted Days 2–45 averages.
- Failure modes that surfaced (the rm -rf reflex, the GITHUB_ prefix collision, etc.) and how they were handled.
- Honest multi-assistant framing: which tool did what, measured, not claimed.

No "AI built the whole thing in an afternoon" claims. The goal of this document and the AI-workflow log is to make the AI-assisted delivery reproducible — which means being honest about where AI helped, where it hurt, and where multi-assistant coordination created friction.

---

## 12. Changes to this document

Version history and scope changes tracked in `docs/CHANGELOG.md`. Any change to §1 (tools in use) or §3 (not-allowed list) requires an ADR.
