/*
  # Fix Mover Signup RLS Policy
  
  ## Problem
  The error "new row violates row-level security policy for table 'movers'"
  occurs during mover signup because the INSERT policy is missing or incorrect.
  
  ## Solution
  Ensure the movers table has a proper INSERT policy that allows
  authenticated users to create their own mover profile.
*/

-- ============================================================================
-- Fix movers table INSERT policy
-- ============================================================================

-- First, check if RLS is enabled (it should be)
ALTER TABLE movers ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing INSERT policies to avoid conflicts
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'movers' 
    AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON movers', policy_record.policyname);
  END LOOP;
END $$;

-- Create the INSERT policy
CREATE POLICY "movers_insert_own_profile"
  ON movers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Ensure SELECT and UPDATE policies exist
-- ============================================================================

-- Drop and recreate SELECT policy
DROP POLICY IF EXISTS "Movers can view own profile" ON movers;
DROP POLICY IF EXISTS "movers_select_own" ON movers;

CREATE POLICY "movers_select_own"
  ON movers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- Drop and recreate UPDATE policy
DROP POLICY IF EXISTS "Movers can update own profile" ON movers;
DROP POLICY IF EXISTS "movers_update_own" ON movers;

CREATE POLICY "movers_update_own"
  ON movers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Fix mover_documents policies
-- ============================================================================

ALTER TABLE mover_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Movers can insert own documents" ON mover_documents;
DROP POLICY IF EXISTS "mover_documents_insert_own" ON mover_documents;

-- Create INSERT policy for mover_documents
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

-- SELECT policy
DROP POLICY IF EXISTS "Movers can view own documents" ON mover_documents;
DROP POLICY IF EXISTS "mover_documents_select_own" ON mover_documents;

CREATE POLICY "mover_documents_select_own"
  ON mover_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_documents.mover_id
      AND movers.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============================================================================
-- Fix trucks policies
-- ============================================================================

ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Movers can insert own trucks" ON trucks;
DROP POLICY IF EXISTS "trucks_insert_own" ON trucks;

-- Create INSERT policy for trucks
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

-- SELECT policy
DROP POLICY IF EXISTS "Movers can view own trucks" ON trucks;
DROP POLICY IF EXISTS "trucks_select_own" ON trucks;

CREATE POLICY "trucks_select_own"
  ON trucks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = trucks.mover_id
      AND movers.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============================================================================
-- Add helpful indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_movers_user_id_auth ON movers(user_id);
CREATE INDEX IF NOT EXISTS idx_mover_documents_mover_id_auth ON mover_documents(mover_id);
CREATE INDEX IF NOT EXISTS idx_trucks_mover_id_auth ON trucks(mover_id);

-- ============================================================================
-- Verify policies are correctly set up
-- ============================================================================

-- This query should return the policies we just created
-- Run this manually to verify:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('movers', 'mover_documents', 'trucks')
-- ORDER BY tablename, cmd;
