-- ============================================================================
-- SIMPLEST FIX POSSIBLE - Run this NOW in Supabase SQL Editor
-- ============================================================================
-- This removes ALL policies and creates just ONE simple INSERT policy
-- ============================================================================

-- Remove ALL existing policies on movers
DROP POLICY IF EXISTS "Public can view verified movers" ON movers;
DROP POLICY IF EXISTS "Movers can view own profile" ON movers;
DROP POLICY IF EXISTS "Movers can update own profile" ON movers;
DROP POLICY IF EXISTS "Admins can view all movers" ON movers;
DROP POLICY IF EXISTS "Admins can update mover profiles" ON movers;
DROP POLICY IF EXISTS "movers_insert_public" ON movers;
DROP POLICY IF EXISTS "movers_insert_own_profile" ON movers;
DROP POLICY IF EXISTS "movers_select_own" ON movers;
DROP POLICY IF EXISTS "movers_update_own" ON movers;
DROP POLICY IF EXISTS "movers_update_admin" ON movers;
DROP POLICY IF EXISTS "movers_delete_admin" ON movers;
DROP POLICY IF EXISTS "Authenticated users can create mover profile" ON movers;
DROP POLICY IF EXISTS "Anyone can create mover profile" ON movers;

-- Create the simplest INSERT policy
CREATE POLICY "allow_insert_authenticated"
  ON movers 
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create SELECT policy so users can see their profile after creating it
CREATE POLICY "allow_select_own"
  ON movers 
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- Allow public to see verified movers (for the marketplace)
CREATE POLICY "allow_select_verified"
  ON movers 
  FOR SELECT 
  TO public
  USING (verification_status = 'verified' AND is_active = true);

-- Allow updates to own profile
CREATE POLICY "allow_update_own"
  ON movers 
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin access
CREATE POLICY "allow_admin_all"
  ON movers 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- Verify it worked
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'movers' 
ORDER BY cmd;

-- You should see exactly 5 policies:
-- 1. allow_admin_all (ALL)
-- 2. allow_insert_authenticated (INSERT)  
-- 3. allow_select_own (SELECT)
-- 4. allow_select_verified (SELECT)
-- 5. allow_update_own (UPDATE)
