/*
  # Completely Fix Admins RLS - Remove All Recursion

  1. Changes
    - Drop ALL existing policies on admins table
    - Create simple, non-recursive policies
    - Allow authenticated users to read their own admin record directly
    - Allow admin operations without checking the admins table recursively

  2. Security
    - Users can only see their own admin record
    - No recursive queries that would cause infinite loops
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Authenticated users can view own admin record" ON admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
DROP POLICY IF EXISTS "Admins can view admins" ON admins;

-- Create a simple SELECT policy - users can only view their own record
CREATE POLICY "Users can view own admin record"
  ON admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create INSERT policy (for system use only, not through recursion)
CREATE POLICY "Service role can insert admins"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (false);  -- Block all inserts through normal auth

-- Create UPDATE policy (users can update their own record)
CREATE POLICY "Users can update own admin record"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create DELETE policy (block all deletes for safety)
CREATE POLICY "Block all deletes"
  ON admins
  FOR DELETE
  TO authenticated
  USING (false);
