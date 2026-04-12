-- ============================================
-- Migration: Add vehicle_ownership + fix dual notification
-- ============================================

-- 1. Add vehicle_ownership column to movers table
ALTER TABLE movers ADD COLUMN IF NOT EXISTS vehicle_ownership text DEFAULT 'owns' CHECK (vehicle_ownership IN ('owns', 'rents'));

-- 2. Fix dual notification issue: update the client insert notification function
-- to skip if the user has user_type='mover' in metadata
CREATE OR REPLACE FUNCTION notify_admins_on_client_insert()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_record RECORD;
  client_name TEXT;
  user_meta jsonb;
BEGIN
  -- Check if user is a mover (from metadata)
  SELECT raw_user_meta_data INTO user_meta
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Skip notification if user_type is 'mover'
  IF user_meta->>'user_type' = 'mover' THEN
    RETURN NEW;
  END IF;

  -- Also skip if user already exists in movers table
  IF EXISTS (SELECT 1 FROM movers WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  -- Build client name
  client_name := COALESCE(
    NULLIF(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), ''),
    NEW.email,
    'Client inconnu'
  );

  -- Notify all admins
  FOR admin_record IN
    SELECT user_id FROM admins
  LOOP
    INSERT INTO notifications (
      user_id,
      user_type,
      type,
      title,
      message,
      created_at
    ) VALUES (
      admin_record.user_id,
      'admin',
      'client_registration',
      'Nouvelle inscription client',
      'Un nouveau client s''est inscrit: ' || client_name || ' (' || NEW.email || ')',
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;
