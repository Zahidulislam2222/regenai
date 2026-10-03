-- Signed Shopify webhook delivery log. Payloads and customer data are not stored.
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  delivery_id TEXT PRIMARY KEY,
  shop TEXT NOT NULL,
  topic TEXT NOT NULL,
  triggered_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  payload_sha256 TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_shop ON webhook_deliveries(shop);
