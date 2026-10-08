-- An email-only compliance payload cannot be acted on after discarding its
-- contact address. Store that one field encrypted with a shop-bound AAD.
ALTER TABLE privacy_requests ADD COLUMN email_ciphertext TEXT;
