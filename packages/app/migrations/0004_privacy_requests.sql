-- Minimum durable metadata for Shopify privacy requests. Contact fields and
-- raw webhook bodies are never stored here.
CREATE TABLE IF NOT EXISTS privacy_requests (
  delivery_id TEXT PRIMARY KEY,
  shop TEXT NOT NULL,
  topic TEXT NOT NULL CHECK (topic IN ('customers/data_request', 'customers/redact')),
  customer_id TEXT,
  data_request_id TEXT,
  received_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'manual_review', 'no_data', 'redacted'))
);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_shop_status
  ON privacy_requests(shop, status, received_at);
