-- Keep a durable completion timestamp while clearing encrypted contact data.
ALTER TABLE privacy_requests ADD COLUMN completed_at INTEGER;
