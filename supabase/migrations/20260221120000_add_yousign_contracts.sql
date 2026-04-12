-- ============================================================
-- Migration: YouSign Electronic Signature Contracts
-- ============================================================

-- Table: mover_contracts (YouSign signature tracking)
CREATE TABLE IF NOT EXISTS mover_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid NOT NULL REFERENCES movers(id) ON DELETE CASCADE,

  -- YouSign identifiers
  yousign_signature_request_id text,
  yousign_document_id text,
  yousign_signer_id text,

  -- Status tracking
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'sent', 'opened', 'signed', 'declined', 'expired', 'error'
    )),

  -- Contract content
  contract_pdf_url text,
  signed_pdf_url text,
  contract_data jsonb DEFAULT '{}',

  -- Timestamps
  sent_at timestamptz,
  opened_at timestamptz,
  signed_at timestamptz,
  declined_at timestamptz,
  expired_at timestamptz,
  expires_at timestamptz,

  -- Admin tracking
  sent_by_admin_id uuid,
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mover_contracts_mover ON mover_contracts(mover_id);
CREATE INDEX IF NOT EXISTS idx_mover_contracts_status ON mover_contracts(status);
CREATE INDEX IF NOT EXISTS idx_mover_contracts_yousign ON mover_contracts(yousign_signature_request_id);

-- RLS
ALTER TABLE mover_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mover_contracts"
  ON mover_contracts FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Movers can view own contracts"
  ON mover_contracts FOR SELECT
  USING (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));

-- Extend verification_status values
ALTER TABLE movers DROP CONSTRAINT IF EXISTS movers_verification_status_check;
ALTER TABLE movers ADD CONSTRAINT movers_verification_status_check
  CHECK (verification_status IN (
    'pending', 'documents_verified', 'contract_sent',
    'contract_signed', 'verified', 'rejected'
  ));

-- Storage bucket for signed contracts
INSERT INTO storage.buckets (id, name, public)
VALUES ('signed-contracts', 'signed-contracts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins manage signed-contracts" ON storage.objects FOR ALL
  USING (bucket_id = 'signed-contracts'
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Movers read own signed-contracts" ON storage.objects FOR SELECT
  USING (bucket_id = 'signed-contracts'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM movers WHERE user_id = auth.uid()
    ));

-- Storage bucket for contract templates (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-templates', 'contract-templates', true)
ON CONFLICT (id) DO NOTHING;
