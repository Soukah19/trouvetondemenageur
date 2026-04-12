-- ============================================================================
-- DIAGNOSTIC: Check Current RLS Status and Policies for Movers Table
-- ============================================================================

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'movers';

-- Check all current policies on movers table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'movers'
ORDER BY cmd, policyname;

-- Check if the table exists and has data
SELECT COUNT(*) as total_movers FROM movers;

-- Test the current user's authentication status (run this while logged in)
-- This should return the current user's ID if authenticated
SELECT auth.uid() as current_user_id;