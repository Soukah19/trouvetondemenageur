-- ============================================================================
-- ULTIMATE FIX: Create Mover Profile Function
-- ============================================================================
-- This function bypasses RLS and creates the mover profile securely
-- Run this in Supabase SQL Editor
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_mover_profile_secure(
  p_user_id UUID,
  p_company_name TEXT,
  p_siret TEXT,
  p_email TEXT,
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
  user_id UUID,
  company_name TEXT,
  email TEXT,
  verification_status TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that the user_id matches the authenticated user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create profile for another user';
  END IF;

  -- Check if a mover profile already exists for this user
  IF EXISTS (SELECT 1 FROM movers WHERE movers.user_id = p_user_id) THEN
    RAISE EXCEPTION 'A mover profile already exists for this user';
  END IF;

  -- Insert the mover record and return it
  RETURN QUERY
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
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_company_name,
    p_siret,
    p_email,
    p_phone,
    p_address,
    p_city,
    p_postal_code,
    p_manager_firstname,
    p_manager_lastname,
    p_manager_phone,
    COALESCE(p_description, ''),
    COALESCE(p_coverage_area, ARRAY[]::TEXT[]),
    COALESCE(p_services, ARRAY[]::TEXT[]),
    'pending',
    false,
    NOW(),
    NOW()
  )
  RETURNING 
    movers.id,
    movers.user_id,
    movers.company_name,
    movers.email,
    movers.verification_status,
    movers.is_active;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_mover_profile_secure TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_mover_profile_secure IS 
'Securely creates a mover profile for the authenticated user. Bypasses RLS to avoid session timing issues during signup.';

-- Test the function (replace with actual values)
-- SELECT * FROM create_mover_profile_secure(
--   auth.uid(),
--   'Test Company',
--   '12345678901234',
--   'test@example.com',
--   '0123456789',
--   '123 Main St',
--   'Paris',
--   '75001',
--   'John',
--   'Doe',
--   '0123456789',
--   'Test description',
--   ARRAY['Paris', 'Lyon'],
--   ARRAY['standard']
-- );
