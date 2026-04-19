# ADR-006 — Multi-assistant AI governance (vs single-assistant)

**Status:** Accepted  **Date:** 2026-04-20 (Day 4)

## Context
Kindred Grove was deliberately single-assistant (Claude Code only) to keep velocity measurement clean. RegenAI targets a different Anderson Collaborative JD checklist that **explicitly requires** Cursor, Codex, Microsoft 365 Copilot, and GitHub Copilot as mandatory skill tags. A single-assistant project leaves those tags uncovered.

## Decision
**Multi-assistant by design. Each tool has a documented scope, role, and commit-trailer convention.** Scopes non-overlapping; primary orchestrator is Claude Code.

| Tool | Scope | Commit trailer |
|---|---|---|
| Claude Code (Opus 4.7) | Primary orchestrator — authors files, runs git, runs CI, writes docs | `Co-Authored-By: Claude Opus 4.7` |
| Shopify Dev MCP | Knowledge layer only (read-only Shopify docs + GraphQL schema) | n/a |
| Cursor Pro | Tab-complete + Composer sessions on React components | `AI-assisted: cursor — <scope>` |
| GitHub Copilot | Inline completion in JSX/TS/Rust (not authoring full files) | `AI-assisted: copilot — <scope>` |
| OpenAI Codex (ChatGPT) | Reasoning-heavy prompts where Claude tokens are best-saved | `AI-assisted: codex — <scope>` |
| Claude Design | Day 1 brand system generation only | n/a (one-shot) |

## Alternatives rejected
- **Single-assistant like KG** — closes none of the JD skill tags. Portfolio story doesn't close Anderson's asks.
- **Tool salad (everything turned on, no rules)** — coherence risk high, portfolio reviewers see confusion not discipline.
- **Claude + one other** — leaves 2 of 4 JD skill tags unchecked.

## Consequences
**+** All four JD mandatory AI skill tags (Cursor / Codex / MS Copilot / GH Copilot) closable with real, reviewed evidence.
**+** AI_GOVERNANCE.md spells out per-tool scope, review boundary, failure modes (§8 — "where AI is weakest").
**+** Commit trailers make the case-study narrative reproducible, not claimed.
**−** Multi-tool coordination under time pressure — patterns can drift across assistants touching the same file. Mitigation: TaskList + per-task commits + single reviewer pass per task.
**−** Cursor Pro + Copilot + ChatGPT Plus subscriptions cost money (~$50/mo combined). Already on user's side, excluded per $0-infra scope.

**Reversibility:** High. Scope each assistant down at any time via ADR-amendment.
