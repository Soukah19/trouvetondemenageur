# Quick Fix Guide - Mover Signup Error

## 🚨 Problem
**Error**: `401 Unauthorized - new row violates row-level security policy for table "movers"`

## ✅ Quick Solution (5 minutes)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Fix
1. Click **New Query**
2. Copy and paste this code:

```sql
-- Quick fix for mover signup RLS error
ALTER TABLE movers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create mover profile" ON movers;
DROP POLICY IF EXISTS "movers_insert_own_profile" ON movers;

CREATE POLICY "movers_insert_own_profile"
  ON movers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix related tables
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
```

3. Click **Run** (or press F5)

### Step 3: Verify
Run this to verify the fix:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('movers', 'mover_documents', 'trucks')
  AND cmd = 'INSERT';
```

You should see 3 policies listed.

### Step 4: Test
1. Go to your mover signup page
2. Try signing up again
3. ✅ It should work now!

## 📋 What This Does

- ✅ Allows authenticated users to create their mover profile
- ✅ Allows movers to upload their documents
- ✅ Allows movers to add their trucks
- ✅ Maintains security (users can only create their own records)

## 🔍 Alternative: Use Migration File

If you prefer using migrations:

1. Copy `20260130000001_fix_mover_signup_rls_comprehensive.sql` to your `supabase/migrations` folder
2. Run: `supabase db push`

## 📞 Support

If issues persist:
1. Check if RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'movers';`
2. Check existing policies: `SELECT * FROM pg_policies WHERE tablename = 'movers';`
3. Review full guide: `FIX_MOVER_SIGNUP_RLS.md`

---
**Estimated time to fix**: 5 minutes  
**Difficulty**: Easy (copy-paste SQL)  
**Risk**: Low (only affects mover signup, can be reverted)
