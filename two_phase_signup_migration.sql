-- ============================================================================
-- Two-Phase Mover Signup System
-- ============================================================================
-- Phase 1: Email signup and verification
-- Phase 2: Profile completion after email is verified
--
-- This migration creates the necessary structure for the new flow
-- ============================================================================

-- Create a temporary table to store incomplete mover signups
CREATE TABLE IF NOT EXISTS mover_signup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  signup_step TEXT NOT NULL DEFAULT 'email_verification', -- email_verification, profile_info, documents
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE mover_signup_progress ENABLE ROW LEVEL SECURITY;

-- Policies for mover_signup_progress
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
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mover_signup_progress_user_id ON mover_signup_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mover_signup_progress_step ON mover_signup_progress(signup_step);

-- Function to create initial signup record
CREATE OR REPLACE FUNCTION public.create_mover_signup_intent(
  p_email TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  signup_step TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to create signup intent';
  END IF;

  -- Insert or update signup progress
  INSERT INTO mover_signup_progress (user_id, email, signup_step)
  VALUES (v_user_id, p_email, 'email_verification')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = NOW()
  RETURNING 
    mover_signup_progress.id,
    mover_signup_progress.user_id,
    mover_signup_progress.email,
    mover_signup_progress.signup_step
  INTO id, user_id, email, signup_step;
  
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_mover_signup_intent TO authenticated;

-- Function to update signup progress with company info
CREATE OR REPLACE FUNCTION public.update_mover_signup_profile(
  p_company_name TEXT,
  p_siret TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_postal_code TEXT,
  p_manager_firstname TEXT,
  p_manager_lastname TEXT,
  p_manager_phone TEXT,
  p_description TEXT DEFAULT '',
  p_coverage_area TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_services TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (
  id UUID,
  signup_step TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Update signup progress
  UPDATE mover_signup_progress
  SET 
    company_name = p_company_name,
    siret = p_siret,
    phone = p_phone,
    address = p_address,
    city = p_city,
    postal_code = p_postal_code,
    manager_firstname = p_manager_firstname,
    manager_lastname = p_manager_lastname,
    manager_phone = p_manager_phone,
    description = p_description,
    coverage_area = p_coverage_area,
    services = p_services,
    signup_step = 'documents',
    updated_at = NOW()
  WHERE user_id = v_user_id
  RETURNING 
    mover_signup_progress.id,
    mover_signup_progress.signup_step
  INTO id, signup_step;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No signup progress found for user';
  END IF;
  
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_mover_signup_profile TO authenticated;

-- Function to complete signup (called after documents are uploaded)
CREATE OR REPLACE FUNCTION public.complete_mover_signup()
RETURNS TABLE (
  mover_id UUID,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_signup_progress RECORD;
  v_mover_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Check if email is verified
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = v_user_id 
    AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Email must be verified before completing signup';
  END IF;

  -- Get signup progress
  SELECT * INTO v_signup_progress
  FROM mover_signup_progress
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No signup progress found';
  END IF;

  -- Check if all required fields are present
  IF v_signup_progress.company_name IS NULL OR
     v_signup_progress.siret IS NULL OR
     v_signup_progress.phone IS NULL THEN
    RAISE EXCEPTION 'Missing required company information';
  END IF;

  -- Create the actual mover record
  INSERT INTO movers (
    user_id,
    company_name,
    siret,
    email,
    phone,
    address,
    city,
    postal_code,
    manager_firstname,
    manager_lastname,
    manager_phone,
    description,
    coverage_area,
    services,
    verification_status,
    is_active
  ) VALUES (
    v_user_id,
    v_signup_progress.company_name,
    v_signup_progress.siret,
    v_signup_progress.email,
    v_signup_progress.phone,
    v_signup_progress.address,
    v_signup_progress.city,
    v_signup_progress.postal_code,
    v_signup_progress.manager_firstname,
    v_signup_progress.manager_lastname,
    v_signup_progress.manager_phone,
    COALESCE(v_signup_progress.description, ''),
    COALESCE(v_signup_progress.coverage_area, ARRAY[]::TEXT[]),
    COALESCE(v_signup_progress.services, ARRAY[]::TEXT[]),
    'pending',
    false
  )
  RETURNING id INTO v_mover_id;

  -- Delete signup progress (no longer needed)
  DELETE FROM mover_signup_progress WHERE user_id = v_user_id;

  RETURN QUERY SELECT v_mover_id, true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_mover_signup TO authenticated;

-- Add comment
COMMENT ON TABLE mover_signup_progress IS 
'Temporary storage for mover signup data before email verification and document upload';

COMMENT ON FUNCTION public.create_mover_signup_intent IS 
'Creates initial signup record after user registers (Phase 1)';

COMMENT ON FUNCTION public.update_mover_signup_profile IS 
'Updates signup progress with company information (Phase 2)';

COMMENT ON FUNCTION public.complete_mover_signup IS 
'Completes signup after documents are uploaded, creates actual mover record (Phase 3)';
