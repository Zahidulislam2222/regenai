# AI Workflow — RegenAI

> **Purpose:** Every AI-assisted commit, decision, prompt, and velocity data-point for the RegenAI 105-day build logged here. Functions as:
> 1. The case-study narrative source for the Phase 1 deliverable (Day 45 case-study site)
> 2. Companion to [`AI_GOVERNANCE.md`](./AI_GOVERNANCE.md) (rules vs. this file's "what happened")
> 3. Honest comparison point against Kindred Grove — which was single-assistant by design; RegenAI is explicitly multi-assistant to close Anderson Collaborative JD tool-skill gaps (Cursor, Codex, Copilot)

Last updated: 2026-04-20 (Day 1, session 1)

---

## 1. Tooling

| Tool | Role in this project | Access surface |
|---|---|---|
| **Claude Code (Opus 4.7, 1M context, Max 5× plan)** | Primary dev agent. Drives file edits, Git, CI, deploys, ADR authorship, schema design, test generation. | Full filesystem + local shell. Session-based, 5-hour plan windows. |
| **Shopify Dev MCP** (`@shopify/dev-mcp`) | Shopify-specific knowledge layer for Claude Code. Live Liquid filter reference, current GraphQL schema, theme-check rules, Admin API scope catalog, Function template catalog. | Read-only against Shopify's public docs + schema. Connected via `.mcp.json`, verified 2026-04-20 Day 1. |
| **Cursor (Pro)** | Secondary pair-programmer for React component spikes and refactor passes. Used for: Tab-based inline completion in `packages/ui/`, Composer sessions for multi-file component refactors, Agent mode for bounded tasks Claude Code delegates. | Local VS Code-fork IDE. |
| **GitHub Copilot** | Inline React/JSX completion in PRs. Used for: boilerplate component scaffolding, prop-type autocomplete, test-case generation in Vitest, Storybook arg-type suggestions. | IDE plugin (VS Code / Cursor). |
| **OpenAI Codex (via ChatGPT)** | Schema queries (GraphQL), refactor spikes, ad-hoc debugging across languages (React, Rust for Functions, SQL for dbt). Used for: reasoning-heavy prompts where Claude's token budget is better spent elsewhere. | Web / ChatGPT app. |
| **Claude Design** (research preview) | Brand system generation (Day 1 — full token set from brand brief). Downstream consumers: `packages/ui/`, Tailwind config, all component theming. | Via Claude.ai app with Design feature enabled (Max plan). |

### Why multi-assistant (vs Kindred Grove's single-assistant)

Kindred Grove was deliberately single-assistant (Claude Code only) to keep the velocity-measurement story clean. RegenAI is deliberately **multi-assistant** because:

1. **Anderson Collaborative JD explicitly lists Cursor, Codex, Microsoft 365 Copilot, GitHub Copilot** as mandatory skill tags. The KG project showed Claude/MCP only; RegenAI closes those tag gaps with real, logged evidence.
2. **Different tools excel at different tasks.** Cursor's Tab-complete beats Claude Code for small inline edits in long React files. Codex via ChatGPT handles some reasoning at lower token cost. Claude Code orchestrates — the others assist.
3. **Honest governance is more defensible.** A portfolio review will see the AI_GOVERNANCE.md and recognize a real, reviewed, measured workflow — not a tool-salad.

---

## 2. Rules of Engagement

1. **AI writes, human reviews.** Nothing any assistant produces ships without human read-through. Exceptions: auto-generated boilerplate (conventional-commit lints, commit-message templates, ESLint auto-fix).

2. **Every AI-assisted commit labeled** with the `Co-Authored-By` trailer for Claude Code (the primary orchestrator):
   ```
   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```
   Commits where Cursor / Copilot / Codex contributed substantively also carry an `AI-assisted:` trailer identifying the secondary tool:
   ```
   AI-assisted: cursor — Storybook arg-type refactor across 15 stories
   AI-assisted: copilot — autocompleted Vitest test skeletons
   AI-assisted: codex — GraphQL schema query optimization
   ```

3. **Prompt disclosure** for non-trivial prompts (new ADR, new workflow, new component, cross-cutting refactor): summarized under Session Notes with intent, first-draft quality, human rewrite rate.

4. **Never commit AI-generated code without local checks.** Minimum gates: `npm run lint`, `npm run typecheck`, relevant unit tests.

5. **Reject AI output if:** it hallucinates Shopify APIs, uses deprecated Liquid/React patterns, violates WCAG 2.2, weakens CSP, introduces unvetted dependencies, fabricates FDA/DSHEA claim wording.

6. **Tool scope isolation** — each assistant has a documented primary role (§1 above). When roles overlap, the orchestrator (Claude Code) decides; cross-tool output must be reconciled in one commit, not layered.

---

## 3. Prompts Library

### Phase category: Scaffolding / Setup (Days 1–3)

**Prompt — "Generate RegenAI brand system from brand brief"** *(Claude Design, Day 1)*
```
Given docs/BRAND-BRIEF.md, output a complete brand-token system as JSON for
packages/ui + Tailwind config consumption. Include color (brand + status +
surface + border with WCAG contrast annotations), typography (family + size
scale + weight + line-height + letter-spacing), space (0 through 64 Tailwind
scale), radius, shadow, motion (duration + easing with reduced-motion
fallback), layout (container + breakpoint), z-index, and component defaults.
All contrast ratios ≥ 4.5:1 on bone base. Reference brands: Therabody, Oura,
Whoop, Lumen, Eight Sleep — clinical-modern aesthetic, not lifestyle-fluffy.
```
→ Resulted in `docs/design-system/brand-tokens.json` (260 lines, 9 categories, 120+ tokens). Human edits: 0 — output matched spec on first pass.

**Prompt — "Scaffold RegenAI Hydrogen storefront into packages/storefront"** *(Claude Code, Day 1)*
```
Use `shopify hydrogen init` to scaffold into packages/storefront with:
--language ts --styling tailwind --markets subfolders --mock-shop --no-git
--no-shortcut --no-install-deps. After scaffold, run npm install manually
(the CLI's auto-install prompt fails non-interactively). Create monorepo
root package.json with npm workspaces, .gitattributes for LF normalization,
.nvmrc pinning Node 20.18.0, .editorconfig, root README + LICENSE.
```
→ 812 packages installed in 5 min. 2 expected virtual-type TS errors (resolved via `npm run codegen` in D2.x). Human edits: 0 on scaffold output; +6 supplementary files written (monorepo root).

### Phase category: CI Pipeline (Day 3, upcoming)

*(To be populated when D3.1 runs.)*

### Phase category: Components + design system (Day 4, upcoming)

*(To be populated when D4.1/D4.2 run.)*

### Phase category: PDP + PLP (Days 8–10, upcoming)

*(To be populated.)*

---

## 4. Velocity Log

Format: task → without-AI estimate (based on similar hand-coded work I've done) → with-AI actual → multiplier.

| Task | Phase | Hand-coded estimate | AI-assisted actual | Multiplier |
|---|---|---|---|---|
| Brand brief (10-section, ~2 pages) | D1.1 | 90 min | 6 min | 15× |
| SOW doc (9-section agency-style) | D1.1 | 2 hrs | 10 min | 12× |
| Brand tokens JSON (full design system) | D1.1 | 4 hrs | 3 min | 80× (Claude Design one-shot) |
| BUILD-LOG + RESUME scaffolding | D1.1 | 20 min | 5 min | 4× |
| Monorepo root setup (6 files) | D1.2 | 30 min | 4 min | 7.5× |
| Hydrogen scaffold (deps install + verify) | D1.2 | n/a (manual CLI) | n/a (tool-bounded) | — |
| Git init + GH repo + protection + secrets × 30 | D1.3 | 90 min manual | 8 min | 11× |

**Running average through Day 1 (5 comparable tasks):** ~9.6× multiplier.

---

## 5. Before / After Examples

*(To be populated when meaningful comparisons are available — typically after accessibility pass, performance audit, complex component implementation.)*

---

## 6. Session Notes

### 2026-04-20 — Session 1, Day 1 (D1.1 → D1.3 + partial D1.4)

**Session plan vs actual:**
- Planned: Days 1–10 end-to-end
- Actual: D1.1 + D1.2 + D1.3 complete. D1.4 in progress. Session continues — user clarified "95%" refers to Max plan usage limit (5-hour), not context window. Plan-usage sat at ~41% when I incorrectly checkpointed early. Resuming.

**Key moments:**

1. **Claude Design brand-token generation** — 260-line JSON produced on first prompt; zero human edits needed. Velocity one-shot at ~80× multiplier. Tokens cleanly importable into Tailwind config (D2.1) + `@regenai/ui` (D4.1).

2. **Hydrogen CLI non-interactive quirk** — `shopify hydrogen init` crashed on `--install-deps` because it prompts for package manager selection when no lock file exists. Workaround: `--no-install-deps` then `npm install` manually. Documented in BUILD-LOG for future reference.

3. **`rm -rf packages/storefront` blocked by deny list** — after the `--install-deps` prompt crash, I reflexively tried to `rm -rf packages/storefront` to retry. The global `~/.claude/settings.json` deny list (configured earlier in the session per user's "don't ask for permission" + safety-rail dual request) hard-blocked it. Turned out the directory was already scaffolded correctly — the crash was only at the install step. Correct move: inspect first (`ls`), then retry without `--install-deps`. **Lesson:** the deny list is a proper safety rail — trust it, inspect before destroying.

4. **GH secret bulk-push hit `GITHUB_` prefix collision** — `gh secret set -f .env` refused `GITHUB_TOKEN=` (reserved prefix). Filtered out that + empty-value lines on retry. First run had pushed most secrets before erroring, retry filled remaining. Both passes shown in GH Secrets timeline (20:52:13 + 20:52:25).

5. **Misread of the user's "95% session" rule.** Stopped at ~40% plan usage thinking context window was the gate. User corrected: "i said ussage limit ideot 95%" — it's the 5-hour Claude Max plan meter. Memory file `feedback_session_stop_rule.md` written to prevent repeat.

**Honest weakness surfaced Day 1:**
Claude Code's default response to tooling friction is to retry with `rm -rf`. This is a learned pattern from test/dev CI contexts but is inappropriate when the state might be partially correct (as it was with Hydrogen's scaffold). The deny list (configured globally Day 0) saved state and forced an inspect-first pattern. Locking the deny list into `~/.claude/settings.json` was a higher-leverage decision than it looked at the time.

---

## 7. Metrics tracked over the 105-day build

- **Velocity multiplier** — running average hand-time vs AI-assisted time (target: ~8× through Phase 1)
- **AI-commit percentage** — commits with `Co-Authored-By` trailer ÷ total commits (target: >95%)
- **Human rewrite rate** — how often AI output was edited before commit (target: <30% in Days 1–21, rising to <50% in Days 22–45 as complexity grows)
- **MCP query frequency** — how many times Shopify Dev MCP was queried during build (proxy for "used MCP for real work, not just installed it")
- **Cursor Composer session count** — measures secondary-assistant engagement (target: ≥15 sessions across the 105 days — real use, not token)
- **Copilot acceptance rate** — inline completions accepted vs shown (target: ≥40% on JSX/TS, ≥30% on Rust Functions)
- **Codex handoff count** — prompts sent to Codex for reasoning tasks vs kept in Claude Code (measures token-cost efficiency)
- **Prompt reuse rate** — prompts from this library used more than once (library compounding — target: >50% for scaffolding/ADR/component categories)
