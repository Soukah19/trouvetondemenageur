-- ============================================
-- Migration: Prospects System V2
-- - Reduce mover_prospects required fields
-- - Add has_phone flag for filtering
-- - Create client_prospects table
-- - Add prospect_type column for email-only movers
-- ============================================

-- 1. Add has_phone flag to mover_prospects for fast filtering
ALTER TABLE mover_prospects ADD COLUMN IF NOT EXISTS has_phone boolean DEFAULT true;
ALTER TABLE mover_prospects ADD COLUMN IF NOT EXISTS discovery_email_sent boolean DEFAULT false;
ALTER TABLE mover_prospects ADD COLUMN IF NOT EXISTS discovery_email_sent_at timestamptz;

-- Backfill has_phone based on existing data
UPDATE mover_prospects SET has_phone = (
  COALESCE(phone, '') != '' OR COALESCE(mobile, '') != ''
);

-- Index for fast phone filtering
CREATE INDEX IF NOT EXISTS idx_mover_prospects_has_phone ON mover_prospects(has_phone);
CREATE INDEX IF NOT EXISTS idx_mover_prospects_discovery_email ON mover_prospects(discovery_email_sent);

-- 2. Create client_prospects table
CREATE TABLE IF NOT EXISTS client_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email text NOT NULL,
  firstname text DEFAULT '',
  lastname text DEFAULT '',
  phone text DEFAULT '',
  
  -- Flags
  has_phone boolean DEFAULT true,
  
  -- Email tracking
  discovery_email_sent boolean DEFAULT false,
  discovery_email_sent_at timestamptz,
  
  -- Invitation tracking (for those with phone who were called)
  call_status text DEFAULT 'not_called' CHECK (call_status IN ('not_called', 'called_interested', 'called_not_interested', 'called_no_answer', 'callback_later')),
  call_notes text DEFAULT '',
  called_at timestamptz,
  callback_date timestamptz,
  
  invitation_status text DEFAULT 'not_invited' CHECK (invitation_status IN ('not_invited', 'invited', 'signed_up')),
  invitation_token uuid,
  invitation_sent_at timestamptz,
  invitation_expires_at timestamptz,
  invitation_clicked_at timestamptz,
  
  -- Link to user if they signed up
  user_id uuid REFERENCES auth.users(id),
  
  -- Import metadata
  import_batch_id text,
  raw_data jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_prospects_email ON client_prospects(email);
CREATE INDEX IF NOT EXISTS idx_client_prospects_has_phone ON client_prospects(has_phone);
CREATE INDEX IF NOT EXISTS idx_client_prospects_call_status ON client_prospects(call_status);
CREATE INDEX IF NOT EXISTS idx_client_prospects_invitation_status ON client_prospects(invitation_status);
CREATE INDEX IF NOT EXISTS idx_client_prospects_discovery_email ON client_prospects(discovery_email_sent);

ALTER TABLE client_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client_prospects" ON client_prospects
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Public can read client_prospects" ON client_prospects
  FOR SELECT USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_client_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_client_prospects_updated_at ON client_prospects;
CREATE TRIGGER trigger_client_prospects_updated_at
  BEFORE UPDATE ON client_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_client_prospects_updated_at();
