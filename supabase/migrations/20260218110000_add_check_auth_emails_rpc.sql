-- ============================================
-- Migration: Add RPC to check auth.users emails for import dedup
-- Allows admin to check if emails already exist in auth.users
-- before importing prospects
-- ============================================

CREATE OR REPLACE FUNCTION check_existing_auth_emails(email_list text[])
RETURNS TABLE(email text) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(u.email) AS email
  FROM auth.users u
  WHERE LOWER(u.email) = ANY(
    SELECT LOWER(unnest(email_list))
  );
$$;

-- Only admins can call this function
REVOKE ALL ON FUNCTION check_existing_auth_emails(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_existing_auth_emails(text[]) TO authenticated;
