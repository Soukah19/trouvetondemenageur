/*
  # Fix verification_status constraint to include 'approved'
  
  The frontend uses 'approved' but the database constraint only allows 'verified'.
  This migration updates the constraint to accept both values.
*/

-- Drop the existing constraint
ALTER TABLE verification_documents 
DROP CONSTRAINT IF EXISTS verification_documents_verification_status_check;

-- Add new constraint with 'approved' included
ALTER TABLE verification_documents 
ADD CONSTRAINT verification_documents_verification_status_check 
CHECK (verification_status IN ('pending', 'verified', 'approved', 'rejected'));

-- Also fix mover_documents table if it has the same constraint
ALTER TABLE mover_documents 
DROP CONSTRAINT IF EXISTS mover_documents_verification_status_check;

ALTER TABLE mover_documents 
ADD CONSTRAINT mover_documents_verification_status_check 
CHECK (verification_status IN ('pending', 'verified', 'approved', 'rejected'));
