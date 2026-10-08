-- Browser-bound, single-use OAuth state and opaque merchant sessions.
CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  shop TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS merchant_sessions (
  session_hash TEXT PRIMARY KEY,
  shop TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_merchant_sessions_expiry ON merchant_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_merchant_sessions_shop ON merchant_sessions(shop);
