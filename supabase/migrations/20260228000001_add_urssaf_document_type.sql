-- Migration: Add 'urssaf' document type to mover_documents and verification_documents
-- This adds support for the URSSAF attestation document that movers must upload

-- 1. Update mover_documents CHECK constraint to include 'urssaf'
ALTER TABLE mover_documents 
DROP CONSTRAINT IF EXISTS mover_documents_document_type_check;

ALTER TABLE mover_documents 
ADD CONSTRAINT mover_documents_document_type_check 
  CHECK (document_type = ANY (ARRAY[
    'kbis'::text, 
    'insurance'::text, 
    'license'::text, 
    'identity_recto'::text, 
    'identity_verso'::text, 
    'urssaf'::text, 
    'other'::text
  ]));

-- 2. Update verification_documents CHECK constraint to include 'urssaf'
ALTER TABLE verification_documents 
DROP CONSTRAINT IF EXISTS verification_documents_document_type_check;

ALTER TABLE verification_documents 
ADD CONSTRAINT verification_documents_document_type_check 
  CHECK (document_type IN (
    'kbis',
    'insurance',
    'id_card',
    'passport',
    'driver_license',
    'vehicle_registration',
    'technical_control',
    'transport_license',
    'urssaf',
    'other'
  ));
