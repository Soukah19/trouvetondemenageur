-- ============================================
-- Migration: Fix prospects email uniqueness & case sensitivity
-- Fixes:
--   1. Add UNIQUE constraint on mover_prospects.email (prevents duplicate emails)
--   2. Add UNIQUE constraint on client_prospects.email (prevents duplicate emails)
--   3. Add case-insensitive indexes for email lookups
-- ============================================

-- First, clean up any existing duplicate emails in mover_prospects (keep the earliest)
DELETE FROM mover_prospects a
USING mover_prospects b
WHERE a.id > b.id
  AND LOWER(a.email) = LOWER(b.email);

-- Same for client_prospects
DELETE FROM client_prospects a
USING client_prospects b
WHERE a.id > b.id
  AND LOWER(a.email) = LOWER(b.email);

-- Add unique constraint on mover_prospects email (case-insensitive)
DROP INDEX IF EXISTS idx_mover_prospects_email;
CREATE UNIQUE INDEX idx_mover_prospects_email_unique ON mover_prospects (LOWER(email));

-- Add unique constraint on client_prospects email (case-insensitive)
DROP INDEX IF EXISTS idx_client_prospects_email;
CREATE UNIQUE INDEX idx_client_prospects_email_unique ON client_prospects (LOWER(email));
