-- ============================================================================
-- OPTION 1: Disable Email Confirmation Globally (Easiest)
-- ============================================================================
-- This cannot be done via SQL - you must do it in the Supabase Dashboard:
-- 
-- 1. Go to Supabase Dashboard
-- 2. Click "Authentication" in left sidebar
-- 3. Click "Providers"
-- 4. Click "Email" provider
-- 5. Scroll down to "Email confirmation"
-- 6. Toggle OFF "Enable email confirmations"
-- 7. Click "Save"
-- 
-- After this, signups will have an immediate active session

-- ============================================================================
-- OPTION 2: Auto-Confirm Mover Emails via Trigger (Recommended)
-- ============================================================================
-- This automatically confirms emails for movers without disabling it globally

-- Create a function to auto-confirm mover emails
CREATE OR REPLACE FUNCTION public.auto_confirm_mover_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if this is a mover signup (you can add logic to detect this)
  -- For now, we'll auto-confirm all new users
  -- You might want to add metadata to distinguish movers from clients
  
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmation_token = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS auto_confirm_mover_trigger ON auth.users;
CREATE TRIGGER auto_confirm_mover_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_mover_email();

-- ============================================================================
-- OPTION 3: Manually Confirm a User (For Testing)
-- ============================================================================
-- Run this to manually confirm a specific user's email

-- Replace 'user@example.com' with the actual email
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmation_token = NULL,
  updated_at = NOW()
WHERE email = 'user@example.com'
  AND email_confirmed_at IS NULL;

-- Verify it worked
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'user@example.com';

-- ============================================================================
-- OPTION 4: Function to Confirm User After Signup (Best for Production)
-- ============================================================================
-- This is the safest approach - only auto-confirm if certain conditions are met

CREATE OR REPLACE FUNCTION public.confirm_mover_email(user_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email
    AND email_confirmed_at IS NULL;
  
  IF user_id IS NULL THEN
    RETURN FALSE; -- User not found or already confirmed
  END IF;
  
  -- Confirm the email
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    confirmation_token = NULL,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.confirm_mover_email TO authenticated, anon;

-- Usage in frontend after signUp:
-- await supabase.rpc('confirm_mover_email', { user_email: 'user@example.com' })

-- ============================================================================
-- VERIFICATION: Check if email confirmation is required
-- ============================================================================

-- Check recent signups
SELECT 
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Not confirmed - Session will fail'
    ELSE '✅ Confirmed - Session active'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check if there's a session for a user
SELECT 
  u.email,
  u.email_confirmed_at,
  COUNT(s.id) as active_sessions
FROM auth.users u
LEFT JOIN auth.sessions s ON u.id = s.user_id
WHERE u.email = 'your-test-email@example.com'
GROUP BY u.email, u.email_confirmed_at;
