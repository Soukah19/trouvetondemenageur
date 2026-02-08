# URGENT FIX: Authentication Error in Profile Completion

## The Problem

You're seeing this error:
```
POST https://...supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
AuthApiError: Invalid login credentials
```

## Root Cause

The modified `MoverSignupPage.tsx` still has code trying to sign in with email/password (lines 358-361), but in the two-phase flow:
- User already signed up in Phase 1
- User is already authenticated
- Email/password fields don't exist in Phase 3
- Trying to sign in with non-existent credentials fails

## The Fix (5 minutes)

### Option 1: Replace the File (RECOMMENDED)

**Replace your `src/pages/MoverSignupPage.tsx` with the new `MoverProfileCompletionPage.tsx`**

```bash
# Backup your current file first
mv src/pages/MoverSignupPage.tsx src/pages/MoverSignupPage.tsx.backup

# Copy the new fixed file
cp MoverProfileCompletionPage.tsx src/pages/MoverSignupPage.tsx
```

### Option 2: Manual Fix

If you prefer to manually edit, **remove these lines** from `MoverSignupPage.tsx`:

**DELETE lines 340-380 (approximately):**
```typescript
// REMOVE THIS ENTIRE SECTION:
// Check if we have an active session
const { data: sessionCheck } = await supabase.auth.getSession();

if (!sessionCheck.session) {
  // No session means email confirmation is likely required
  // Try to sign in with the credentials we just created
  showToast('Configuration de la session...', 'info');
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: authData.email,
    password: authData.password
  });
  
  // ... rest of the sign in logic
}
```

**REPLACE with:**
```typescript
// Simply verify user is authenticated
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  throw new Error('Session expirée, veuillez vous reconnecter');
}

if (!user.email_confirmed_at) {
  throw new Error('Veuillez vérifier votre email avant de continuer');
}

const userId = user.id;
```

## What Changed in the Fixed File

### Removed ❌:
1. Email and password state variables
2. Email/password input fields from the form
3. `supabase.auth.signUp()` call
4. `supabase.auth.signInWithPassword()` call
5. Session retry logic trying to sign in

### Added ✅:
1. **Authentication check on mount:**
   ```typescript
   useEffect(() => {
     checkAuthenticationStatus();
   }, []);
   ```

2. **Email verification check:**
   ```typescript
   if (!user.email_confirmed_at) {
     navigate('/mover/verify-email', { state: { email: user.email } });
     return;
   }
   ```

3. **Progress loading from `mover_signup_progress` table:**
   ```typescript
   loadSavedProgress(user.id);
   ```

4. **Uses RPC functions instead of direct inserts:**
   ```typescript
   // Save company info
   await supabase.rpc('update_mover_signup_profile', {...});
   
   // Complete signup
   await supabase.rpc('complete_mover_signup');
   ```

## How Phase 3 Now Works

```
1. User lands on /mover/profile-completion
   ↓
2. Page checks: Is user authenticated? ✓
   ↓
3. Page checks: Is email verified? ✓
   ↓
4. Load any saved progress from mover_signup_progress table
   ↓
5. User fills company info and uploads documents
   ↓
6. Call update_mover_signup_profile() to save info
   ↓
7. Upload all documents to storage
   ↓
8. Call complete_mover_signup() to create mover record
   ↓
9. Success! Redirect to /mover/signup-success
```

## Updated Router Configuration

Make sure your `Router.tsx` has:

```typescript
// Phase 1: Email signup (no auth required)
<Route path="/mover/signup" element={<MoverEmailSignup />} />

// Phase 2: Email verification (no auth required, but checks for verification)
<Route path="/mover/verify-email" element={<MoverVerifyEmailPage />} />

// Phase 3: Profile completion (requires auth + verified email)
<Route path="/mover/profile-completion" element={<MoverProfileCompletionPage />} />
```

**Note:** The component can still be named `MoverSignupPage` in the file, but it should be the FIXED version without authentication logic.

## Testing the Fix

1. **Clear your browser data** (important!):
   - Open DevTools → Application → Clear Storage
   - Click "Clear site data"

2. **Start fresh signup:**
   ```
   Navigate to /mover/signup
   → Enter email and password
   → Verify email
   → Should redirect to profile completion WITHOUT errors
   ```

3. **Verify no authentication errors:**
   - Open Browser Console (F12)
   - Should NOT see any 400 Bad Request errors
   - Should NOT see "Invalid login credentials"

## Quick Verification

**Check if you're using the fixed version:**

Open your `MoverSignupPage.tsx` and search for:
- ❌ If you find `signInWithPassword` → **Wrong version, use fixed file**
- ❌ If you find `authData.email` and `authData.password` → **Wrong version**
- ✅ If you find `checkAuthenticationStatus()` → **Correct version**
- ✅ If you find `complete_mover_signup()` → **Correct version**

## Files Provided

1. **MoverProfileCompletionPage.tsx** - Complete fixed version (use this!)
2. **URGENT_FIX_AUTH_ERROR.md** - This guide

## Summary

**Problem:** Code tried to authenticate user who's already authenticated  
**Solution:** Remove authentication logic, just verify user is signed in  
**Time to fix:** 5 minutes (copy new file)  
**Risk:** None - just replacing broken auth logic  

---

**After applying this fix, your two-phase signup should work perfectly!** 🎉
