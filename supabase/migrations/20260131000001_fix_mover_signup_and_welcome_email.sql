/*
  # Fix Mover Signup Flow and Welcome Email
  
  ## Changes
  1. Create mover_signup_progress table if not exists
  2. Add RLS policies for mover_signup_progress
  3. Add trigger to send welcome email when account is validated
  4. Fix notification triggers for welcome emails
*/

-- ============================================================================
-- Create mover_signup_progress table
-- ============================================================================

CREATE TABLE IF NOT EXISTS mover_signup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT,
  siret TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  manager_firstname TEXT,
  manager_lastname TEXT,
  manager_phone TEXT,
  description TEXT,
  coverage_area TEXT[],
  services TEXT[],
  step TEXT DEFAULT 'email_pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE mover_signup_progress ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own signup progress" ON mover_signup_progress;
DROP POLICY IF EXISTS "Users can insert own signup progress" ON mover_signup_progress;
DROP POLICY IF EXISTS "Users can update own signup progress" ON mover_signup_progress;
DROP POLICY IF EXISTS "Admins can view all signup progress" ON mover_signup_progress;

-- Create RLS policies
CREATE POLICY "Users can view own signup progress"
  ON mover_signup_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signup progress"
  ON mover_signup_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signup progress"
  ON mover_signup_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can see all signup progress
CREATE POLICY "Admins can view all signup progress"
  ON mover_signup_progress FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

-- ============================================================================
-- Create notification_queue table for welcome emails
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================================
-- Function to queue welcome email when mover is validated
-- ============================================================================

CREATE OR REPLACE FUNCTION queue_mover_welcome_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Only trigger when is_verified changes from false to true
  IF OLD.is_verified = false AND NEW.is_verified = true THEN
    -- Get user email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;

    -- Queue the welcome email
    INSERT INTO notification_queue (type, recipient_email, recipient_name, data)
    VALUES (
      'mover_account_validated',
      COALESCE(user_email, NEW.email),
      NEW.company_name,
      jsonb_build_object(
        'company_name', NEW.company_name,
        'mover_id', NEW.id,
        'user_id', NEW.user_id
      )
    );

    -- Also create a notification for the mover
    INSERT INTO notifications (user_id, type, title, message, created_at)
    VALUES (
      NEW.user_id,
      'account_validated',
      'Votre compte a été validé ! 🎉',
      'Félicitations ! Votre compte déménageur a été vérifié et validé. Vous pouvez maintenant recevoir des demandes de devis.',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for mover validation
DROP TRIGGER IF EXISTS on_mover_validated ON movers;
CREATE TRIGGER on_mover_validated
  AFTER UPDATE ON movers
  FOR EACH ROW
  EXECUTE FUNCTION queue_mover_welcome_email();

-- ============================================================================
-- Function to queue welcome email when client account is confirmed
-- ============================================================================

CREATE OR REPLACE FUNCTION queue_client_welcome_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user info
  SELECT email, email_confirmed_at INTO user_record
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Queue welcome email for new clients with confirmed email
  IF user_record.email_confirmed_at IS NOT NULL THEN
    INSERT INTO notification_queue (type, recipient_email, recipient_name, data)
    VALUES (
      'client_welcome',
      user_record.email,
      NEW.first_name,
      jsonb_build_object(
        'client_id', NEW.id,
        'first_name', NEW.first_name,
        'user_id', NEW.user_id
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for client welcome email
DROP TRIGGER IF EXISTS on_client_created_welcome ON clients;
CREATE TRIGGER on_client_created_welcome
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION queue_client_welcome_email();

-- ============================================================================
-- Add account_validated notification type if not exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'notification_type' 
    AND typtype = 'e'
  ) THEN
    -- Type doesn't exist, check if we're using TEXT for type column
    NULL;
  END IF;
END $$;

-- ============================================================================
-- Index for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created ON notification_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_mover_signup_progress_user_id ON mover_signup_progress(user_id);

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON mover_signup_progress TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;
