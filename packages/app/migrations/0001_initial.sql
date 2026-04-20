-- Migration 0001 — initial schema for @regenai/app on Cloudflare D1.
--
-- Tables scoped by PROJECT_PLAN §2 "Layer 2 — Custom Shopify App":
--   * sessions            — OAuth session persistence (mirrored to KV for read speed)
--   * clinician_review_queue — claim-audit queue for ADR-016 compliance-as-code gate
--   * protocol_tracker    — 8-week patient adherence rows (Phase 2 activates via push)
--   * oauth_tokens        — encrypted per-shop access tokens (Shopify embedded app flow)

-- -----------------------------------------------------------------------
-- sessions
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  shop          TEXT NOT NULL,
  state         TEXT NOT NULL,
  is_online     INTEGER NOT NULL DEFAULT 0,
  scope         TEXT,
  expires       INTEGER,  -- epoch ms; null = session-scoped
  access_token  TEXT NOT NULL,
  user_id       TEXT,
  first_name    TEXT,
  last_name     TEXT,
  email         TEXT,
  account_owner INTEGER NOT NULL DEFAULT 0,
  locale        TEXT,
  collaborator  INTEGER NOT NULL DEFAULT 0,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_sessions_shop ON sessions(shop);

-- -----------------------------------------------------------------------
-- oauth_tokens — per-shop offline app tokens, encrypted at rest.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oauth_tokens (
  shop          TEXT PRIMARY KEY,
  access_token  TEXT NOT NULL,  -- AES-GCM encrypted; key held as SHOPIFY_TOKEN_ENC_KEY secret
  scope         TEXT NOT NULL,
  installed_at  INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  uninstalled_at INTEGER
);

-- -----------------------------------------------------------------------
-- clinician_review_queue — claim-audit queue.
-- Each row = a product-copy diff pending clinician sign-off.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinician_review_queue (
  id              TEXT PRIMARY KEY,
  shop            TEXT NOT NULL,
  product_id      TEXT NOT NULL,
  product_handle  TEXT NOT NULL,
  product_title   TEXT NOT NULL,
  submitter_id    TEXT NOT NULL,            -- user_id of the merchant staff who edited
  submitted_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  status          TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','changes_requested')),
  claim_summary   TEXT NOT NULL,            -- one-line summary for the queue UI
  diff_json       TEXT NOT NULL,            -- JSON blob of {before, after, fields}
  evidence_level  TEXT,                     -- A/B/C/D
  fda_class       TEXT,                     -- 'Class I' | 'Class II' | 'Class III' | NULL
  reviewer_id     TEXT,
  reviewed_at     INTEGER,
  reviewer_note   TEXT,
  github_pr_url   TEXT                      -- auto-populated by Day-20 webhook
);
CREATE INDEX IF NOT EXISTS idx_review_status ON clinician_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_submitted ON clinician_review_queue(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_shop ON clinician_review_queue(shop);

-- -----------------------------------------------------------------------
-- protocol_tracker — 8-week adherence rows.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_tracker (
  id             TEXT PRIMARY KEY,
  shop           TEXT NOT NULL,
  customer_id    TEXT NOT NULL,
  protocol_id    TEXT NOT NULL,             -- Shopify metaobject reference
  started_at     INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  target_weeks   INTEGER NOT NULL DEFAULT 8,
  completions    TEXT NOT NULL DEFAULT '[]',-- JSON array of {week, day, completed_at}
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','abandoned')),
  last_updated   INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_tracker_customer ON protocol_tracker(customer_id);
CREATE INDEX IF NOT EXISTS idx_tracker_status ON protocol_tracker(status);
