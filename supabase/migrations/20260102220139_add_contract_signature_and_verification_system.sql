/*
  # Contract Signature and Document Verification System

  1. New Tables
    - `contracts`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key to quotes)
      - `client_id` (uuid, foreign key to auth.users)
      - `mover_id` (uuid, foreign key to movers)
      - `contract_text` (text) - The actual contract terms
      - `status` (text) - draft, pending_signature, signed, cancelled
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
    
    - `contract_signatures`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key to contracts)
      - `signer_id` (uuid, foreign key to auth.users)
      - `signer_type` (text) - client or mover
      - `signature_data` (text) - Base64 encoded signature image
      - `ip_address` (text)
      - `signed_at` (timestamptz)
    
    - `document_verifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `document_type` (text) - id_card, passport, insurance, etc.
      - `document_url` (text) - Storage path
      - `verification_status` (text) - pending, verified, rejected
      - `verification_data` (jsonb) - OCR extracted data
      - `verified_at` (timestamptz)
      - `verified_by` (text) - manual or auto
      - `rejection_reason` (text)
      - `created_at` (timestamptz)
    
    - `fraud_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `alert_type` (text) - duplicate_document, suspicious_activity, fake_id, etc.
      - `severity` (text) - low, medium, high, critical
      - `details` (jsonb)
      - `status` (text) - new, investigating, resolved, false_positive
      - `created_at` (timestamptz)
      - `resolved_at` (timestamptz)
      - `resolved_by` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage their own data
    - Restricted access for fraud alerts
*/

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,
  contract_text text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'signed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Create contract_signatures table
CREATE TABLE IF NOT EXISTS contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
  signer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signer_type text NOT NULL CHECK (signer_type IN ('client', 'mover')),
  signature_data text NOT NULL,
  ip_address text,
  signed_at timestamptz DEFAULT now()
);

-- Create document_verifications table
CREATE TABLE IF NOT EXISTS document_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('id_card', 'passport', 'insurance', 'business_license', 'driver_license')),
  document_url text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_data jsonb DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  verified_by text,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create fraud_alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('duplicate_document', 'suspicious_activity', 'fake_id', 'multiple_accounts', 'payment_fraud', 'location_mismatch')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'false_positive')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Contracts policies
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = contracts.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = contracts.mover_id
      AND movers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = contracts.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Contract signatures policies
CREATE POLICY "Users can view signatures on their contracts"
  ON contract_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_signatures.contract_id
      AND (
        contracts.client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM movers
          WHERE movers.id = contracts.mover_id
          AND movers.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can sign their own contracts"
  ON contract_signatures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = signer_id);

-- Document verifications policies
CREATE POLICY "Users can view their own documents"
  ON document_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents"
  ON document_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON document_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fraud alerts policies (users can only see alerts about themselves)
CREATE POLICY "Users can view their own fraud alerts"
  ON fraud_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create fraud alerts"
  ON fraud_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_mover_id ON contracts(mover_id);
CREATE INDEX IF NOT EXISTS idx_contracts_quote_id ON contracts(quote_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_document_verifications_user_id ON document_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_document_verifications_status ON document_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts(severity);