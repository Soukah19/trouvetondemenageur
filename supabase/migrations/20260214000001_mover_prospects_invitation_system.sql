-- ============================================
-- Migration: Mover Prospects & Invitation System
-- ============================================

-- 1. Make manager_phone nullable (for imported movers without phone)
ALTER TABLE movers ALTER COLUMN manager_phone DROP NOT NULL;
ALTER TABLE movers ALTER COLUMN manager_phone SET DEFAULT '';

-- 2. Add invitation_token column to movers table for magic link signup
ALTER TABLE movers ADD COLUMN IF NOT EXISTS invitation_token text UNIQUE;
ALTER TABLE movers ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE movers ADD COLUMN IF NOT EXISTS invitation_source text DEFAULT 'manual'; -- 'manual' | 'import'

-- 3. Create mover_prospects table for imported leads before they become movers
CREATE TABLE IF NOT EXISTS mover_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company info (from CSV)
  company_name text NOT NULL,
  siret text,
  email text NOT NULL,
  phone text DEFAULT '',
  mobile text DEFAULT '',
  address text DEFAULT '',
  postal_code text DEFAULT '',
  city text DEFAULT '',
  department text DEFAULT '',
  region text DEFAULT '',
  activity text DEFAULT '',
  
  -- Manager info (parsed from DIRIGEANTS)
  manager_firstname text DEFAULT '',
  manager_lastname text DEFAULT '',
  
  -- Call tracking
  call_status text DEFAULT 'not_called' CHECK (call_status IN ('not_called', 'called_interested', 'called_not_interested', 'called_no_answer', 'callback_later')),
  call_notes text DEFAULT '',
  called_at timestamptz,
  called_by uuid REFERENCES auth.users(id),
  callback_date timestamptz,
  
  -- Invitation tracking
  invitation_status text DEFAULT 'not_invited' CHECK (invitation_status IN ('not_invited', 'invited', 'signed_up', 'expired')),
  invitation_token text UNIQUE,
  invitation_sent_at timestamptz,
  invitation_expires_at timestamptz,
  invitation_clicked_at timestamptz,
  
  -- Link to actual mover if they signed up
  mover_id uuid REFERENCES movers(id),
  
  -- Import metadata
  import_batch_id text, -- to group imports together
  raw_data jsonb, -- store original CSV row for reference
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mover_prospects_email ON mover_prospects(email);
CREATE INDEX IF NOT EXISTS idx_mover_prospects_call_status ON mover_prospects(call_status);
CREATE INDEX IF NOT EXISTS idx_mover_prospects_invitation_status ON mover_prospects(invitation_status);
CREATE INDEX IF NOT EXISTS idx_mover_prospects_invitation_token ON mover_prospects(invitation_token);
CREATE INDEX IF NOT EXISTS idx_mover_prospects_import_batch ON mover_prospects(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_movers_invitation_token ON movers(invitation_token);

-- RLS policies
ALTER TABLE mover_prospects ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage mover_prospects" ON mover_prospects
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Public can read their own prospect by invitation token (for signup page)
CREATE POLICY "Public can read prospect by invitation token" ON mover_prospects
  FOR SELECT
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_mover_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mover_prospects_updated_at ON mover_prospects;
CREATE TRIGGER trigger_mover_prospects_updated_at
  BEFORE UPDATE ON mover_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_mover_prospects_updated_at();
