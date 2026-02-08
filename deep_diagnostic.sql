-- ============================================================================
-- DEEP DIAGNOSTIC - Find the REAL problem
-- ============================================================================
-- Run each section ONE BY ONE and report the results
-- ============================================================================

-- SECTION 1: Check if RLS is the actual problem
-- ============================================================================
-- Temporarily disable RLS to test if that's really the issue
ALTER TABLE movers DISABLE ROW LEVEL SECURITY;

-- Now try to insert (this should work if RLS was the problem)
-- If this still fails, RLS is NOT the issue

-- Re-enable it immediately
ALTER TABLE movers ENABLE ROW LEVEL SECURITY;


-- SECTION 2: Check if there are triggers blocking the insert
-- ============================================================================
SELECT 
    tgname as trigger_name,
    tgtype,
    tgenabled,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'movers'::regclass
  AND tgisinternal = false;


-- SECTION 3: Check if there are foreign key constraints causing issues
-- ============================================================================
SELECT
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as foreign_table
FROM pg_constraint
WHERE conrelid = 'movers'::regclass
  AND contype = 'f';


-- SECTION 4: Check the actual table structure
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'movers'
  AND table_schema = 'public'
ORDER BY ordinal_position;


-- SECTION 5: Check for NOT NULL constraints that might be failing
-- ============================================================================
SELECT
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'movers'
  AND table_schema = 'public'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;


-- SECTION 6: Test if auth.uid() is actually working
-- ============================================================================
-- This will show if the user is properly authenticated
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED'
        ELSE '✅ AUTHENTICATED'
    END as auth_status;


-- SECTION 7: Try a simple insert with explicit user_id
-- ============================================================================
-- Replace 'YOUR-AUTH-UID' with the actual auth.uid() from section 6
-- This tests if the policy is working correctly
/*
INSERT INTO movers (
    user_id,
    company_name,
    email,
    verification_status,
    is_active
) VALUES (
    auth.uid(),  -- This should be the authenticated user's ID
    'Test Company',
    'test@example.com',
    'pending',
    false
);
*/


-- SECTION 8: Check if there's a function or trigger that's enforcing additional checks
-- ============================================================================
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%mover%'
  AND n.nspname = 'public'
ORDER BY p.proname;


-- SECTION 9: Check for any check constraints
-- ============================================================================
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'movers'::regclass
  AND contype = 'c';  -- 'c' = CHECK constraint


-- SECTION 10: Look at the exact error in the logs
-- ============================================================================
-- Go to Supabase Dashboard > Database > Logs
-- Filter for "movers" and look for the exact error message
-- The error might give us more details about what's failing
