-- ============================================================================
-- EMERGENCY FIX: Complete RLS Policy Reset for Movers Table
-- ============================================================================
-- This will completely reset ALL policies on movers table and recreate them
-- correctly to fix the 401 Unauthorized error during signup.
-- 
-- Run this in Supabase SQL Editor NOW
-- ============================================================================

-- Step 1: DROP ALL POLICIES ON MOVERS TABLE
-- This is necessary because we have conflicting policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop every single policy on movers table
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'movers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON movers', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Step 2: Verify all policies are dropped
-- This should return 0 rows
SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE tablename = 'movers';

-- Step 3: Create ONLY the necessary policies

-- INSERT policy - Allow authenticated users to create their own profile
CREATE POLICY "movers_insert_authenticated"
  ON movers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT policy - Users can view their own profile, admins can view all
CREATE POLICY "movers_select_own_or_admin"
  ON movers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- SELECT policy - Public can view verified movers (for marketplace)
CREATE POLICY "movers_select_verified_public"
  ON movers FOR SELECT
  TO authenticated, anon
  USING (
    verification_status = 'verified' 
    AND is_active = true
  );

-- UPDATE policy - Users can only update their own profile
CREATE POLICY "movers_update_own"
  ON movers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy - Admins can update any mover profile
CREATE POLICY "movers_update_admin"
  ON movers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- DELETE policy - Admins only
CREATE POLICY "movers_delete_admin"
  ON movers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- Step 4: Verify the new policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual IS NULL THEN 'No USING clause'
    ELSE 'Has USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NULL THEN 'No WITH CHECK clause'
    ELSE 'Has WITH CHECK clause'
  END as check_status
FROM pg_policies 
WHERE tablename = 'movers'
ORDER BY cmd, policyname;

-- ============================================================================
-- Expected output after running this:
-- ============================================================================
-- You should see exactly 6 policies:
-- 1. movers_delete_admin (DELETE)
-- 2. movers_insert_authenticated (INSERT) - WITH CHECK: auth.uid() = user_id
-- 3. movers_select_own_or_admin (SELECT)
-- 4. movers_select_verified_public (SELECT)
-- 5. movers_update_admin (UPDATE)
-- 6. movers_update_own (UPDATE)
-- ============================================================================

-- Step 5: Test the INSERT policy
-- This should succeed (replace with a real UUID if testing)
-- INSERT INTO movers (user_id, company_name, email, verification_status)
-- VALUES (auth.uid(), 'Test Company', 'test@example.com', 'pending');

RAISE NOTICE '✅ Movers table policies have been completely reset and recreated.';
RAISE NOTICE 'Please try the mover signup again - it should work now!';
