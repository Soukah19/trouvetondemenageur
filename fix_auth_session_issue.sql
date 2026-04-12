-- ============================================================================
-- CRITICAL FIX: The REAL Issue - User Not Authenticated After Signup
-- ============================================================================
-- The problem is likely that after signUp(), the user's session might not be
-- automatically established if email confirmation is required.
-- 
-- SOLUTION 1: Disable email confirmation for mover signups
-- SOLUTION 2: Use service role to insert the mover record
-- ============================================================================

-- Check current email confirmation setting
SELECT 
    raw_app_meta_data->>'provider' as provider,
    raw_app_meta_data->>'email_verified' as email_verified,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- SOLUTION 1: Disable Email Confirmation (Quick Fix)
-- ============================================================================
-- Go to Supabase Dashboard > Authentication > Settings > Email Auth
-- Set "Enable email confirmations" to OFF
-- This allows users to be immediately authenticated after signup

-- OR run this to check current setting:
-- You need to change this in the Supabase Dashboard, not via SQL


-- ============================================================================
-- SOLUTION 2: Make movers INSERT work without RLS temporarily
-- ============================================================================
-- This is NOT recommended for production, but for testing:

-- Create a policy that allows INSERT during signup before session is established
DROP POLICY IF EXISTS "allow_insert_during_signup" ON movers;

CREATE POLICY "allow_insert_during_signup"
  ON movers 
  FOR INSERT 
  TO authenticated, anon  -- Allow both authenticated AND anon
  WITH CHECK (true);  -- Temporarily allow all inserts

-- IMPORTANT: After testing, replace with secure policy:
/*
DROP POLICY IF EXISTS "allow_insert_during_signup" ON movers;

CREATE POLICY "allow_insert_authenticated_only"
  ON movers 
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());
*/


-- ============================================================================
-- SOLUTION 3: Use a database function that bypasses RLS
-- ============================================================================
-- Create a function that runs with SECURITY DEFINER (as postgres user)

CREATE OR REPLACE FUNCTION public.create_mover_profile(
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
  p_description TEXT,
  p_coverage_area TEXT[],
  p_services TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- This runs as the postgres user, bypassing RLS
AS $$
DECLARE
  v_mover_id UUID;
  v_result JSON;
BEGIN
  -- Insert the mover record
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
    p_description,
    p_coverage_area,
    p_services,
    'pending',
    false
  )
  RETURNING id INTO v_mover_id;

  -- Return the result as JSON
  SELECT json_build_object(
    'id', id,
    'user_id', user_id,
    'company_name', company_name,
    'email', email
  ) INTO v_result
  FROM movers
  WHERE id = v_mover_id;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_mover_profile TO authenticated, anon;

-- Now in the frontend, instead of:
-- supabase.from('movers').insert({...})
-- 
-- Use:
-- supabase.rpc('create_mover_profile', { p_user_id: userId, ... })
