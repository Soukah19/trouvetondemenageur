/*
  # Add 48-Hour Claim Window for Client Damage Reports

  This migration adds the 48-hour claim window system for clients to report damages after move completion.

  ## Changes

  1. Add `claim_deadline` field to moving_status table
     - Automatically set to 48 hours after completion
  
  2. Update damage_reports table with additional fields
     - `claim_type` - 'before_loading', 'during_move', 'after_delivery'
     - `is_within_deadline` - Boolean to track if claim is valid
  
  3. Add policy for clients to create damage reports within 48 hours
  
  4. Create function to calculate claim deadlines
  
  5. Add trigger to set claim deadline when move is completed
*/

-- Add claim_deadline to moving_status table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'moving_status' AND column_name = 'claim_deadline'
  ) THEN
    ALTER TABLE moving_status ADD COLUMN claim_deadline timestamptz;
  END IF;
END $$;

-- Add new columns to damage_reports table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damage_reports' AND column_name = 'claim_type'
  ) THEN
    ALTER TABLE damage_reports ADD COLUMN claim_type text DEFAULT 'after_delivery' CHECK (claim_type IN ('before_loading', 'during_move', 'after_delivery'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damage_reports' AND column_name = 'is_within_deadline'
  ) THEN
    ALTER TABLE damage_reports ADD COLUMN is_within_deadline boolean DEFAULT true;
  END IF;
END $$;

-- Create function to calculate and set claim deadline
CREATE OR REPLACE FUNCTION set_claim_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL AND NEW.claim_deadline IS NULL THEN
    NEW.claim_deadline := NEW.completed_at + INTERVAL '48 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set claim deadline on completion
DROP TRIGGER IF EXISTS trigger_set_claim_deadline ON moving_status;
CREATE TRIGGER trigger_set_claim_deadline
  BEFORE UPDATE ON moving_status
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION set_claim_deadline();

-- Create function to check if claim is within deadline
CREATE OR REPLACE FUNCTION check_claim_deadline()
RETURNS TRIGGER AS $$
DECLARE
  v_claim_deadline timestamptz;
  v_completed_at timestamptz;
BEGIN
  SELECT ms.claim_deadline, ms.completed_at
  INTO v_claim_deadline, v_completed_at
  FROM moving_status ms
  WHERE ms.quote_request_id = NEW.quote_request_id;
  
  IF v_completed_at IS NOT NULL AND v_claim_deadline IS NOT NULL THEN
    IF NEW.created_at <= v_claim_deadline THEN
      NEW.is_within_deadline := true;
    ELSE
      NEW.is_within_deadline := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check deadline on damage report creation
DROP TRIGGER IF EXISTS trigger_check_claim_deadline ON damage_reports;
CREATE TRIGGER trigger_check_claim_deadline
  BEFORE INSERT ON damage_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_claim_deadline();

-- Update existing completed moves to have claim deadlines
UPDATE moving_status
SET claim_deadline = completed_at + INTERVAL '48 hours'
WHERE status = 'completed' 
  AND completed_at IS NOT NULL 
  AND claim_deadline IS NULL;

-- Movers can also create damage reports for issues found before loading
DROP POLICY IF EXISTS "Movers can create damage reports" ON damage_reports;
CREATE POLICY "Movers can create damage reports"
  ON damage_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND quote_request_id IN (
      SELECT qr.id FROM quote_requests qr
      WHERE qr.accepted_quote_id IN (
        SELECT id FROM quotes WHERE mover_id IN (
          SELECT id FROM movers WHERE user_id = auth.uid()
        )
      )
    )
  );
