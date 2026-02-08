-- ============================================================================
-- DIAGNOSTIC: Check what's wrong with the movers policies
-- ============================================================================

-- 1. Check the actual policy definitions with full details
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,  -- This is the USING clause
  with_check  -- This is the WITH CHECK clause
FROM pg_policies 
WHERE tablename = 'movers'
ORDER BY cmd, policyname;

-- 2. Check if there are any restrictive (non-permissive) policies
SELECT 
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'movers'
  AND permissive = 'RESTRICTIVE';

-- 3. Show the actual SQL that Postgres uses for each policy
SELECT 
  polname as policy_name,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  CASE 
    WHEN polpermissive THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END as permissive_type,
  pg_get_expr(polqual, polrelid) as using_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression,
  polroles::regrole[] as roles
FROM pg_policy
WHERE polrelid = 'movers'::regclass
ORDER BY polcmd, polname;

-- 4. Check if RLS is actually enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'movers';

-- 5. Try to understand why NULL appears
-- NULL in qual/with_check can mean:
-- a) The policy allows all rows (no restriction)
-- b) The policy definition is incomplete
-- c) There's an error in the policy creation

-- Check the actual system catalog
SELECT 
  pol.polname,
  pol.polcmd::text,
  CASE 
    WHEN pol.polqual IS NULL THEN '❌ NULL (allows all rows in USING)'
    ELSE '✅ Has USING restriction'
  END as using_check,
  CASE 
    WHEN pol.polwithcheck IS NULL THEN '❌ NULL (allows all inserts/updates)'
    ELSE '✅ Has WITH CHECK restriction'
  END as with_check_status
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'movers'
  AND pol.polcmd = 'a'  -- 'a' means INSERT
ORDER BY pol.polname;
