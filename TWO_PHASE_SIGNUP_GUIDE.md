# Two-Phase Mover Signup System - Complete Implementation Guide

## Overview

This system splits mover signup into **3 secure phases**:

1. **Phase 1**: Email & Password signup → Email verification required
2. **Phase 2**: Email verification → User confirms their email
3. **Phase 3**: Profile completion → User fills company info and uploads documents

## Benefits

✅ **No RLS issues** - Session is fully established before any inserts  
✅ **Better UX** - Users don't lose uploaded docs if email verification fails  
✅ **More secure** - Verified email required before document uploads  
✅ **Cleaner code** - Separated concerns, easier to maintain  
✅ **Progress tracking** - Users can resume where they left off  

## Implementation Steps

### Step 1: Run Database Migration (5 minutes)

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Copy and paste `two_phase_signup_migration.sql`
3. Click **Run**

This creates:
- `mover_signup_progress` table (stores incomplete signups)
- 3 secure functions for each phase
- Proper RLS policies

### Step 2: Add New Route Files (10 minutes)

Add these 3 new files to your project:

#### A. `src/components/MoverEmailSignup.tsx`
- Email and password signup form
- Creates auth user
- Sends verification email
- Redirects to verification page

#### B. `src/pages/MoverVerifyEmailPage.tsx`
- Waiting page after signup
- Auto-checks if email is verified
- Resend email button
- Auto-redirects when verified

#### C. Keep existing `src/pages/MoverSignupPage.tsx` (but modify it)
- Rename to `MoverProfileCompletionPage.tsx`
- Remove email/password fields (already done)
- This becomes the company info + documents page
- Only accessible after email verification

### Step 3: Update Router (5 minutes)

Update `src/Router.tsx`:

```typescript
// Add these routes
<Route path="/mover/signup" element={<MoverEmailSignup />} />
<Route path="/mover/verify-email" element={<MoverVerifyEmailPage />} />
<Route path="/mover/profile-completion" element={
  <ProtectedRoute requireEmailVerification>
    <MoverProfileCompletionPage />
  </ProtectedRoute>
} />
```

### Step 4: Modify Existing Signup Page (15 minutes)

Transform your current `MoverSignupPage.tsx`:

**Remove:**
- Email and password fields
- `supabase.auth.signUp()` call

**Add at the top:**
```typescript
useEffect(() => {
  // Check if user has verified email
  const checkVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/mover/signup');
      return;
    }
    
    if (!user.email_confirmed_at) {
      navigate('/mover/verify-email', { state: { email: user.email } });
      return;
    }
    
    // Load any saved progress
    const { data: progress } = await supabase
      .from('mover_signup_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (progress) {
      // Pre-fill form with saved data
      setCompanyData({
        company_name: progress.company_name || '',
        siret: progress.siret || '',
        // ... etc
      });
    }
  };
  
  checkVerification();
}, []);
```

**Change the submit function:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Step 1: Save company info
    const { error: profileError } = await supabase.rpc(
      'update_mover_signup_profile',
      {
        p_company_name: companyData.company_name,
        p_siret: companyData.siret,
        p_phone: companyData.phone,
        p_address: companyData.address,
        p_city: companyData.city,
        p_postal_code: companyData.postal_code,
        p_manager_firstname: managerData.manager_firstname,
        p_manager_lastname: managerData.manager_lastname,
        p_manager_phone: managerData.manager_phone,
        p_description: companyData.description || '',
        p_coverage_area: coverageArray,
        p_services: companyData.services
      }
    );

    if (profileError) throw profileError;
    showToast('✓ Informations enregistrées', 'success');

    // Step 2: Upload all documents (same as before)
    // ... your existing document upload code ...

    // Step 3: Complete signup
    const { data: completionData, error: completionError } = await supabase.rpc(
      'complete_mover_signup'
    );

    if (completionError) throw completionError;

    showToast('✓ Inscription complète !', 'success');
    navigate('/mover/signup-success');

  } catch (err: any) {
    console.error('Error:', err);
    showToast(err.message, 'error');
  } finally {
    setLoading(false);
  }
};
```

## Flow Diagram

```
┌─────────────────────────┐
│  User visits /mover/signup  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  MoverEmailSignup Component      │
│  - Enter email & password        │
│  - Click "Create Account"        │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  Supabase sends verification     │
│  email to user's inbox           │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  MoverVerifyEmailPage            │
│  - Shows "Check your email"      │
│  - Auto-checks every 3 seconds   │
│  - Resend email button           │
└───────────┬─────────────────────┘
            │
            ▼
    User clicks link in email
            │
            ▼
┌─────────────────────────────────┐
│  Email confirmed ✓               │
│  Auto-redirect after 2 seconds   │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  MoverProfileCompletionPage      │
│  - Company information form      │
│  - Document upload               │
│  - Submit creates mover profile  │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  Success! Redirect to dashboard  │
└─────────────────────────────────┘
```

## Database Functions Explained

### 1. `create_mover_signup_intent(p_email)`
- Called after email signup
- Creates initial record in `mover_signup_progress`
- Tracks that user started signup process

### 2. `update_mover_signup_profile(...)`
- Called when user fills company info
- Saves data to `mover_signup_progress`
- Allows user to resume later if needed

### 3. `complete_mover_signup()`
- Called after documents uploaded
- Checks email is verified
- Creates actual `movers` record
- Deletes progress record (cleanup)

## Security Features

✅ **Email must be verified** - `complete_mover_signup()` checks `email_confirmed_at`  
✅ **User ownership** - Functions validate `auth.uid()` matches  
✅ **No duplicate profiles** - Checks prevent multiple profiles per user  
✅ **Progress isolated** - Users can only see their own progress  
✅ **Atomic operations** - All or nothing database operations  

## Testing Checklist

### Phase 1 Testing:
- [ ] Navigate to `/mover/signup`
- [ ] Fill email and password
- [ ] Click "Create Account"
- [ ] Check email inbox for verification link
- [ ] Verify redirected to `/mover/verify-email`

### Phase 2 Testing:
- [ ] Verify email page shows correct email
- [ ] Click verification link in email
- [ ] Verify auto-redirect to profile completion
- [ ] Test "Resend email" button works

### Phase 3 Testing:
- [ ] Profile completion form loads
- [ ] Fill all company information
- [ ] Upload all required documents
- [ ] Submit form
- [ ] Verify mover record created in database
- [ ] Verify redirected to success page

## Troubleshooting

### Issue: "Email not verified" error
**Solution**: Ensure user clicked the link in their email before accessing profile completion

### Issue: Function not found
**Solution**: Run the migration again, check function exists:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'create_mover%';
```

### Issue: Progress not saving
**Solution**: Check `mover_signup_progress` table has proper RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'mover_signup_progress';
```

### Issue: Can't access profile completion page
**Solution**: Check if email_confirmed_at is set:
```sql
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'user@example.com';
```

## Rollback Plan

If you need to roll back:

```sql
-- Drop the functions
DROP FUNCTION IF EXISTS public.create_mover_signup_intent CASCADE;
DROP FUNCTION IF EXISTS public.update_mover_signup_profile CASCADE;
DROP FUNCTION IF EXISTS public.complete_mover_signup CASCADE;

-- Drop the table
DROP TABLE IF EXISTS public.mover_signup_progress CASCADE;

-- Revert to old INSERT policy on movers table
CREATE POLICY "movers_insert_authenticated"
  ON movers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Files Provided

1. **two_phase_signup_migration.sql** - Database setup
2. **MoverEmailSignup.tsx** - Phase 1 component
3. **MoverVerifyEmailPage.tsx** - Phase 2 component
4. **TWO_PHASE_SIGNUP_GUIDE.md** - This guide

## Advantages Over Single-Phase

| Feature | Single-Phase | Two-Phase |
|---------|-------------|-----------|
| RLS issues | ❌ Common | ✅ None |
| Session problems | ❌ Frequent | ✅ Resolved |
| UX if verification fails | ❌ Lost data | ✅ Progress saved |
| Security | ⚠️ Good | ✅ Better |
| Error handling | ❌ Complex | ✅ Simple |
| Maintenance | ❌ Difficult | ✅ Easy |

---

**Estimated implementation time**: 30-40 minutes  
**Difficulty**: Moderate  
**Risk**: Low (can be rolled back easily)  
**Recommended**: ✅ Yes - Best practice for production
