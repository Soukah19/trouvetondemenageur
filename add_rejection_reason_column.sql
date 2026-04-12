-- Migration: Add rejection_reason column to mover_documents and verification_documents
-- Run this in Supabase SQL Editor

-- Add rejection_reason to mover_documents
ALTER TABLE mover_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add rejection_reason to verification_documents
ALTER TABLE verification_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Comment
COMMENT ON COLUMN mover_documents.rejection_reason IS 'Reason for document rejection, set by admin';
COMMENT ON COLUMN verification_documents.rejection_reason IS 'Reason for document rejection, set by admin';
