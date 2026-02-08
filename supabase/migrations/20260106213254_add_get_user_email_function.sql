/*
  # Add function to get user email

  1. New Functions
    - `get_user_email(user_id)` - Returns the email for a given user ID
    
  2. Security
    - Only admins can call this function
*/

-- Drop function if exists
DROP FUNCTION IF EXISTS get_user_email(uuid);

-- Create function to get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  is_admin boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
  ) INTO is_admin;

  -- Only allow admins to get user emails
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: Only admins can retrieve user emails';
  END IF;

  -- Get the email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id_param;

  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users (the function itself checks if they're admins)
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;
