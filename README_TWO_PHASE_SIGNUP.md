# Déménageur App - Two-Phase Signup Implementation

## 📦 What's in This Package

This is your complete application with the **two-phase mover signup system** implemented to solve the RLS authentication issues.

### New Files Added

#### 1. Database Migration
- `supabase/migrations/20260130000001_fix_mover_signup_rls_comprehensive.sql`
- `two_phase_signup_migration.sql` - Complete two-phase signup database setup

#### 2. Frontend Components
- `src/components/MoverEmailSignup.tsx` - Phase 1: Email/password signup
- `src/pages/MoverVerifyEmailPage.tsx` - Phase 2: Email verification waiting page
- `src/pages/MoverSignupPage.tsx` - **MODIFIED** - Now Phase 3: Profile completion

#### 3. Documentation
- `TWO_PHASE_SIGNUP_GUIDE.md` - Complete implementation guide
- `SOLUTION_COMPARISON.md` - Why two-phase is better
- `COMPLETE_FIX_GUIDE.md` - Alternative single-phase solution
- `FIX_MOVER_SIGNUP_RLS.md` - Original RLS issue documentation

#### 4. SQL Fixes (Alternative Approaches)
- `create_mover_function.sql` - Function-based approach
- `fix_mover_signup_immediate.sql` - Quick RLS policy fix
- `simple_fix_now.sql` - Simplified policy fix
- `emergency_fix_movers_rls.sql` - Emergency policy reset
- `deep_diagnostic.sql` - Diagnostic queries

---

## 🚀 Quick Start: Implementing Two-Phase Signup

### Prerequisites
- Supabase project running
- Node.js and npm installed
- Access to Supabase Dashboard

### Step 1: Database Setup (5 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste contents of `two_phase_signup_migration.sql`
3. Click **Run**
4. Verify success - you should see:
   - `mover_signup_progress` table created
   - 3 functions created: `create_mover_signup_intent`, `update_mover_signup_profile`, `complete_mover_signup`

**Verification:**
```sql
-- Check table exists
SELECT * FROM mover_signup_progress LIMIT 1;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%mover_signup%';
```

### Step 2: Update Router (5 minutes)

Edit `src/Router.tsx` and update the mover signup routes:

```typescript
// REPLACE the existing /mover/signup route with these:

<Route path="/mover/signup" element={<MoverEmailSignup />} />
<Route path="/mover/verify-email" element={<MoverVerifyEmailPage />} />
<Route path="/mover/profile-completion" element={
  <ProtectedRoute requireEmailVerification>
    <MoverSignupPage />
  </ProtectedRoute>
} />
```

**Note:** The existing `MoverSignupPage.tsx` has been modified to work as Phase 3 (profile completion).

### Step 3: Import New Components (2 minutes)

Add these imports to `src/Router.tsx`:

```typescript
import MoverEmailSignup from './components/MoverEmailSignup';
import MoverVerifyEmailPage from './pages/MoverVerifyEmailPage';
```

### Step 4: Test the Flow (10 minutes)

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Test Phase 1 - Signup:**
   - Navigate to `/mover/signup`
   - Enter email and password
   - Click "Créer mon compte"
   - Should redirect to `/mover/verify-email`

3. **Test Phase 2 - Email Verification:**
   - Check your email inbox
   - Click the verification link
   - Should auto-redirect to `/mover/profile-completion`

4. **Test Phase 3 - Profile Completion:**
   - Fill in company information
   - Upload required documents
   - Submit form
   - Should create mover record and redirect to success page

---

## 📋 What Changed in MoverSignupPage.tsx

The existing `MoverSignupPage.tsx` has been modified:

### Removed:
- Email and password input fields (now in Phase 1)
- Direct `supabase.auth.signUp()` call

### Added:
1. **Email verification check on mount:**
   ```typescript
   useEffect(() => {
     checkEmailVerification();
   }, []);
   ```

2. **Session establishment with retry logic**

3. **Uses RPC functions instead of direct inserts:**
   - `update_mover_signup_profile()` - Saves company info
   - `complete_mover_signup()` - Creates actual mover record

### Why These Changes:
- ✅ Eliminates RLS timing issues
- ✅ Ensures session is fully established
- ✅ Allows progress saving
- ✅ More secure (email verified first)

---

## 🔒 How Two-Phase Signup Solves RLS Issues

### The Original Problem:
```
User signs up → Session not immediately active → 
Insert into movers fails → RLS policy violation (401 error)
```

### The Two-Phase Solution:
```
Phase 1: User signs up → Email sent
         ↓
Phase 2: User verifies email → Session established
         ↓
Phase 3: User completes profile → Insert succeeds (session active)
```

**Key Benefits:**
- Session is 100% established before any inserts
- No timing race conditions
- User doesn't lose uploaded documents if verification fails
- Industry-standard approach (used by GitHub, LinkedIn, Stripe)

---

## 📊 Database Schema

### New Table: `mover_signup_progress`

Stores incomplete signup data until email is verified:

```sql
CREATE TABLE mover_signup_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  signup_step TEXT DEFAULT 'email_verification',
  company_name TEXT,
  siret TEXT,
  phone TEXT,
  -- ... other company fields
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### New Functions:

1. **create_mover_signup_intent(p_email)**
   - Called after email signup
   - Creates initial progress record
   - Tracks signup started

2. **update_mover_signup_profile(...)**
   - Called when user fills company info
   - Saves data to progress table
   - Updates signup_step to 'documents'

3. **complete_mover_signup()**
   - Called after documents uploaded
   - **Validates email is verified**
   - Creates actual `movers` record
   - Deletes progress record (cleanup)

---

## 🔐 Security Features

✅ **Email verification required** - `complete_mover_signup()` checks `email_confirmed_at`  
✅ **User ownership validation** - Functions check `auth.uid()` matches  
✅ **No duplicate profiles** - Prevents multiple profiles per user  
✅ **Progress isolation** - Users only see their own progress  
✅ **Atomic operations** - All-or-nothing database transactions  
✅ **RLS policies** - Proper row-level security on all tables  

---

## 🧪 Testing Checklist

### Phase 1: Email Signup
- [ ] Navigate to `/mover/signup`
- [ ] Fill email: `test@example.com`
- [ ] Fill password: `Test123456!`
- [ ] Click "Créer mon compte"
- [ ] Verify redirect to `/mover/verify-email`
- [ ] Check email inbox for verification link

### Phase 2: Email Verification
- [ ] Verify email page shows correct email
- [ ] Page auto-checks every 3 seconds
- [ ] Click "Renvoyer l'email" button works
- [ ] Click verification link in email
- [ ] Verify auto-redirect to `/mover/profile-completion`

### Phase 3: Profile Completion
- [ ] Form loads without email/password fields
- [ ] Fill all company information
- [ ] Upload KBIS document
- [ ] Upload insurance document
- [ ] Upload transport license
- [ ] Upload identity documents
- [ ] Add at least one truck
- [ ] Submit form
- [ ] Verify success toast appears
- [ ] Verify redirect to success page

### Database Verification
```sql
-- Check mover was created
SELECT * FROM movers WHERE email = 'test@example.com';

-- Check documents were saved
SELECT * FROM mover_documents WHERE mover_id = 'YOUR_MOVER_ID';

-- Check trucks were saved
SELECT * FROM trucks WHERE mover_id = 'YOUR_MOVER_ID';

-- Verify progress was cleaned up
SELECT * FROM mover_signup_progress WHERE email = 'test@example.com';
-- Should return no rows
```

---

## 🆚 Alternative Solution: Single-Phase with Function

If you prefer a single-page signup (not recommended), you can use the alternative approach:

1. Run `create_mover_function.sql` instead of two-phase migration
2. Use the modified `MoverSignupPage.tsx` that calls `create_mover_profile_secure()`

**See `SOLUTION_COMPARISON.md` for detailed pros/cons**

---

## 🐛 Troubleshooting

### Issue: "Function does not exist"
**Solution:**
```sql
-- Check if functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%mover_signup%';

-- If missing, re-run two_phase_signup_migration.sql
```

### Issue: "Email not verified"
**Solution:**
- Ensure user clicked the verification link in their email
- Check: `SELECT email_confirmed_at FROM auth.users WHERE email = 'user@example.com';`
- If NULL, user hasn't verified yet

### Issue: "Progress not saving"
**Solution:**
```sql
-- Check RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'mover_signup_progress';

-- Check if record exists
SELECT * FROM mover_signup_progress WHERE user_id = 'YOUR_USER_ID';
```

### Issue: "Can't access profile completion page"
**Solution:**
- Verify email is confirmed: `SELECT email_confirmed_at FROM auth.users;`
- Check if redirected from verification page
- Try logging out and back in

### Issue: Original RLS error still occurs
**Solution:**
- You may have kept the old single-phase flow
- Ensure routes are updated to use the new three-page flow
- Check that MoverSignupPage uses the RPC functions, not direct inserts

---

## 📁 Project Structure

```
demenageur_app/
├── src/
│   ├── components/
│   │   ├── MoverEmailSignup.tsx          ← NEW: Phase 1
│   │   └── ...
│   ├── pages/
│   │   ├── MoverVerifyEmailPage.tsx      ← NEW: Phase 2
│   │   ├── MoverSignupPage.tsx           ← MODIFIED: Phase 3
│   │   └── ...
│   └── Router.tsx                        ← UPDATE: Add new routes
├── supabase/
│   └── migrations/
│       ├── two_phase_signup_migration.sql ← NEW: Run this
│       └── ...
├── TWO_PHASE_SIGNUP_GUIDE.md             ← READ THIS FIRST
├── SOLUTION_COMPARISON.md
└── package.json
```

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Run `two_phase_signup_migration.sql` on production database
- [ ] Update environment variables (if needed)
- [ ] Test complete signup flow on staging
- [ ] Verify email sending works in production
- [ ] Update any documentation/help articles
- [ ] Monitor error logs for first 24 hours
- [ ] Have rollback plan ready (see TWO_PHASE_SIGNUP_GUIDE.md)

---

## 📚 Documentation Files

1. **TWO_PHASE_SIGNUP_GUIDE.md** - Detailed implementation guide
2. **SOLUTION_COMPARISON.md** - Why two-phase is better
3. **COMPLETE_FIX_GUIDE.md** - Alternative single-phase approach
4. **FIX_MOVER_SIGNUP_RLS.md** - Original issue explanation

---

## 🆘 Support

If you encounter issues:

1. **Check the logs:**
   - Supabase Dashboard → Database → Logs
   - Browser console for frontend errors

2. **Run diagnostics:**
   ```sql
   -- From deep_diagnostic.sql
   SELECT * FROM pg_policies WHERE tablename = 'movers';
   ```

3. **Verify email settings:**
   - Supabase Dashboard → Authentication → Email Templates
   - Check "Enable email confirmations" is ON

4. **Test with service role (debugging only):**
   - Never expose service role in production!
   - Use only for testing in secure environment

---

## ✅ Success Criteria

Your implementation is successful when:

- ✅ User can complete email signup
- ✅ User receives verification email
- ✅ User can verify email via link
- ✅ User can complete profile after verification
- ✅ Documents upload successfully
- ✅ Mover record is created in database
- ✅ No 401 or RLS errors occur
- ✅ User is redirected to success page

---

## 📝 Version Info

- **Version**: 2.0 - Two-Phase Signup
- **Date**: January 30, 2026
- **Changes**: Implemented two-phase signup to resolve RLS issues
- **Status**: Production Ready
- **Recommended**: ✅ Yes

---

## 🎯 Next Steps

1. Read `TWO_PHASE_SIGNUP_GUIDE.md`
2. Run database migration
3. Update routes
4. Test the flow
5. Deploy to production

**Estimated setup time: 30-40 minutes**

Good luck! 🚀
