/*
  # Fix Admins RLS Recursion Issue

  1. Changes
    - Drop the recursive admin policy that causes infinite loop
    - Add a simple policy that allows authenticated users to read their own admin record
    - This fixes the "infinite recursion detected in policy" error during login

  2. Security
    - Users can only read their own admin record (matched by user_id)
    - No data leakage between admin accounts
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view admins" ON admins;

-- Create a simple non-recursive policy
CREATE POLICY "Authenticated users can view own admin record"
  ON admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
