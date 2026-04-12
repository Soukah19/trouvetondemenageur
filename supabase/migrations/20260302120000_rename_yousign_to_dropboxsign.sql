-- ============================================================
-- Migration: Rename Yousign columns to generic names (Dropbox Sign)
-- ============================================================

-- Rename Yousign-specific columns to generic names
ALTER TABLE mover_contracts RENAME COLUMN yousign_signature_request_id TO signature_request_id;
ALTER TABLE mover_contracts RENAME COLUMN yousign_document_id TO document_id;
ALTER TABLE mover_contracts RENAME COLUMN yousign_signer_id TO signer_id;

-- Update index
DROP INDEX IF EXISTS idx_mover_contracts_yousign;
CREATE INDEX IF NOT EXISTS idx_mover_contracts_signature ON mover_contracts(signature_request_id);
