# Fix Guide: Mover Signup RLS Error

## Problem Description

When attempting to sign up as a mover, users encounter the following error:

```
POST https://bvvbkaluajgdurxnnqqu.supabase.co/rest/v1/movers?select=* 401 (Unauthorized)
Erreur lors de l'inscription:
{code: '42501', details: null, hint: null, message: 'new row violates row-level security policy for table "movers"'}
```

## Root Cause

The error occurs because the Row Level Security (RLS) INSERT policy for the `movers` table is either:
1. **Missing** - The policy was never created or was accidentally dropped
2. **Incorrect** - The policy has the wrong conditions
3. **Conflicting** - Multiple policies exist with different conditions

The error happens at line 423 in `src/pages/MoverSignupPage.tsx` when trying to insert a new mover profile:

```typescript
const { data: moverData, error: moverError } = await supabase.from('movers').insert({
  user_id: authResponse.user.id,
  company_name: companyData.company_name,
  // ... other fields
}).select().single();
```

## The Fix

### Option 1: Immediate Fix (Recommended)

Run the SQL script `fix_mover_signup_immediate.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `fix_mover_signup_immediate.sql`
5. Run the query

This will:
- ✅ Drop any conflicting policies
- ✅ Create the correct INSERT policy for movers
- ✅ Create the correct INSERT policies for mover_documents and trucks
- ✅ Verify the policies are correctly set up

### Option 2: Migration File (For Production)

Apply the migration file:

```bash
supabase migration new fix_mover_signup_rls
# Copy contents from: supabase/migrations/20260130000001_fix_mover_signup_rls_comprehensive.sql
supabase db push
```

## What the Fix Does

### 1. Movers Table INSERT Policy

Creates a policy that allows authenticated users to insert their own mover profile:

```sql
CREATE POLICY "movers_insert_own_profile"
  ON movers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

**This means:** Any authenticated user can create a mover record, but only if the `user_id` matches their own authentication ID.

### 2. Mover Documents INSERT Policy

Creates a policy for mover_documents:

```sql
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
```

**This means:** Users can only insert documents for movers they own.

### 3. Trucks INSERT Policy

Similar policy for the trucks table:

```sql
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

## Verification

After applying the fix, verify it worked:

```sql
-- Check the policies exist
SELECT 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename IN ('movers', 'mover_documents', 'trucks')
  AND cmd = 'INSERT';
```

Expected output:
| tablename | policyname | cmd |
|-----------|-----------|-----|
| movers | movers_insert_own_profile | INSERT |
| mover_documents | mover_documents_insert_own | INSERT |
| trucks | trucks_insert_own | INSERT |

## Testing the Fix

1. Go to the mover signup page
2. Fill in all required information
3. Upload required documents
4. Submit the form
5. The signup should now complete successfully

## Additional Notes

### Why This Happened

The RLS policy was likely lost due to:
- A migration that re-enabled RLS without recreating policies
- The migration `20260119233734_fix_critical_rls_security_issues.sql` re-enabled RLS on all tables but didn't ensure INSERT policies existed
- The original policy from `20260102112148_rebuild_trouveton_demenageur_platform.sql` may have been dropped

### Security Considerations

The policy is secure because:
- ✅ Only authenticated users can insert
- ✅ Users can only insert records with their own user_id
- ✅ Prevents users from creating profiles for other users
- ✅ Follows the principle of least privilege

### Related Files Modified

1. **New Migration**: `supabase/migrations/20260130000001_fix_mover_signup_rls_comprehensive.sql`
2. **Immediate Fix Script**: `fix_mover_signup_immediate.sql`
3. **This Guide**: `FIX_MOVER_SIGNUP_RLS.md`

## Storage Policies Already Fixed

Note: The storage bucket policies were already fixed in migration `20260129000001_fix_storage_rls_for_signup.sql`, so document uploads should work correctly.

## If Issues Persist

If the error still occurs after applying this fix:

1. **Check if RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename = 'movers';
   ```

2. **Check if the policy exists**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'movers' AND cmd = 'INSERT';
   ```

3. **Check if there are conflicting policies**:
   ```sql
   SELECT policyname, cmd, with_check FROM pg_policies 
   WHERE tablename = 'movers';
   ```

4. **Test with service role key** (temporarily, for debugging only):
   - This bypasses RLS and should work
   - If it works with service role, the issue is definitely RLS-related

## Success Criteria

✅ Mover can complete signup form  
✅ Documents upload successfully  
✅ Mover profile is created in database  
✅ No 401 Unauthorized errors  
✅ No RLS policy violation errors  
✅ User receives confirmation toast messages  
✅ User is redirected to success page  

---

**Date Created**: January 30, 2026  
**Status**: Ready to Apply  
**Priority**: Critical - Blocks all mover signups
