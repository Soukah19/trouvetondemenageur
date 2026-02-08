-- ============================================================================
-- IMMEDIATE FIX: Run this in Supabase SQL Editor
-- ============================================================================
-- This script fixes the "new row violates row-level security policy" error
-- when movers try to sign up.
-- 
-- Problem: The INSERT policy for the movers table is missing or incorrect
-- Solution: Recreate the INSERT policy correctly
-- ============================================================================

-- Step 1: Ensure RLS is enabled
ALTER TABLE movers ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can create mover profile" ON movers;
DROP POLICY IF EXISTS "Authenticated users can create mover profile" ON movers;
DROP POLICY IF EXISTS "movers_insert_own_profile" ON movers;

-- Step 3: Create the correct INSERT policy
CREATE POLICY "movers_insert_own_profile"
  ON movers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Verify SELECT policy exists (so movers can see their own profile after creation)
DROP POLICY IF EXISTS "Movers can view own profile" ON movers;
DROP POLICY IF EXISTS "movers_select_own" ON movers;

CREATE POLICY "movers_select_own"
  ON movers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- Step 5: Fix mover_documents INSERT policy
ALTER TABLE mover_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Movers can insert own documents" ON mover_documents;
DROP POLICY IF EXISTS "mover_documents_insert_own" ON mover_documents;

CREATE POLICY "mover_documents_insert_own"
  ON mover_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_documents.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Step 6: Fix trucks INSERT policy
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Movers can insert own trucks" ON trucks;
DROP POLICY IF EXISTS "trucks_insert_own" ON trucks;

CREATE POLICY "trucks_insert_own"
  ON trucks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = trucks.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION: Run this to check the policies are correctly created
-- ============================================================================
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN 'INSERT policy exists ✓'
    WHEN cmd = 'SELECT' THEN 'SELECT policy exists ✓'
    ELSE cmd
  END as status
FROM pg_policies 
WHERE tablename IN ('movers', 'mover_documents', 'trucks')
  AND cmd IN ('INSERT', 'SELECT')
ORDER BY tablename, cmd;

-- Expected output should show:
-- movers - movers_insert_own_profile - INSERT
-- movers - movers_select_own - SELECT
-- mover_documents - mover_documents_insert_own - INSERT
-- trucks - trucks_insert_own - INSERT
