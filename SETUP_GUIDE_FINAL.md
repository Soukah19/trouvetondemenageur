# ✅ WORKING TWO-PHASE SIGNUP - FINAL VERSION

## What's Fixed

✅ Router updated with 3 separate routes  
✅ MoverSignupPage.tsx replaced (no more auth errors)  
✅ All components properly connected  
✅ Clean, working flow  

## The Complete Flow

```
Step 1: /mover/signup
→ User enters email + password
→ Clicks "Create Account"
→ Email verification sent

Step 2: /mover/verify-email
→ User sees "Check your email"
→ Page auto-checks if email verified
→ User clicks link in email

Step 3: /mover/profile-completion
→ User fills company information
→ User uploads documents
→ Creates mover profile

Step 4: /mover/signup-success
→ Done!
```

## Setup (2 Steps)

### 1. Run Database Migration (5 min)

Open **Supabase Dashboard → SQL Editor**, paste this and run:

```sql
-- Create progress tracking table
CREATE TABLE IF NOT EXISTS mover_signup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  signup_step TEXT DEFAULT 'email_verification',
  company_name TEXT,
  siret TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  manager_firstname TEXT,
  manager_lastname TEXT,
  manager_phone TEXT,
  description TEXT,
  coverage_area TEXT[],
  services TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mover_signup_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own progress"
  ON mover_signup_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON mover_signup_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON mover_signup_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function 1: Create signup intent
CREATE OR REPLACE FUNCTION create_mover_signup_intent(p_email TEXT)
RETURNS TABLE (id UUID, user_id UUID, email TEXT, signup_step TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;
  
  RETURN QUERY
  INSERT INTO mover_signup_progress (user_id, email, signup_step)
  VALUES (v_user_id, p_email, 'email_verification')
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email
  RETURNING mover_signup_progress.id, mover_signup_progress.user_id, 
            mover_signup_progress.email, mover_signup_progress.signup_step;
END;
$$;

GRANT EXECUTE ON FUNCTION create_mover_signup_intent TO authenticated;

-- Function 2: Update profile info
CREATE OR REPLACE FUNCTION update_mover_signup_profile(
  p_company_name TEXT,
  p_siret TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_postal_code TEXT,
  p_manager_firstname TEXT,
  p_manager_lastname TEXT,
  p_manager_phone TEXT,
  p_description TEXT DEFAULT '',
  p_coverage_area TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_services TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (id UUID, signup_step TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE mover_signup_progress
  SET 
    company_name = p_company_name,
    siret = p_siret,
    phone = p_phone,
    address = p_address,
    city = p_city,
    postal_code = p_postal_code,
    manager_firstname = p_manager_firstname,
    manager_lastname = p_manager_lastname,
    manager_phone = p_manager_phone,
    description = p_description,
    coverage_area = p_coverage_area,
    services = p_services,
    signup_step = 'documents',
    updated_at = NOW()
  WHERE user_id = auth.uid()
  RETURNING mover_signup_progress.id, mover_signup_progress.signup_step;
END;
$$;

GRANT EXECUTE ON FUNCTION update_mover_signup_profile TO authenticated;

-- Function 3: Complete signup
CREATE OR REPLACE FUNCTION complete_mover_signup()
RETURNS TABLE (mover_id UUID, success BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_progress RECORD;
  v_mover_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check email verified
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = v_user_id AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Email must be verified';
  END IF;
  
  -- Get progress
  SELECT * INTO v_progress FROM mover_signup_progress WHERE user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'No signup progress found'; END IF;
  
  -- Create mover
  INSERT INTO movers (
    user_id, company_name, siret, email, phone, address, city, 
    postal_code, manager_firstname, manager_lastname, manager_phone,
    description, coverage_area, services, verification_status, is_active
  ) VALUES (
    v_user_id, v_progress.company_name, v_progress.siret, v_progress.email,
    v_progress.phone, v_progress.address, v_progress.city, v_progress.postal_code,
    v_progress.manager_firstname, v_progress.manager_lastname, v_progress.manager_phone,
    COALESCE(v_progress.description, ''), COALESCE(v_progress.coverage_area, ARRAY[]::TEXT[]),
    COALESCE(v_progress.services, ARRAY[]::TEXT[]), 'pending', false
  ) RETURNING id INTO v_mover_id;
  
  -- Cleanup
  DELETE FROM mover_signup_progress WHERE user_id = v_user_id;
  
  RETURN QUERY SELECT v_mover_id, true;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_mover_signup TO authenticated;
```

### 2. Extract and Use the Zip (2 min)

```bash
# Extract the zip
unzip demenageur_app_CLEAN_TWO_PHASE.zip -d my-app

# Install dependencies (if needed)
cd my-app
npm install

# Start dev server
npm run dev
```

## Testing (5 min)

### Test Phase 1:
1. Go to `http://localhost:5173/mover/signup`
2. You should see a SIMPLE form with only:
   - Email field
   - Password field
   - Confirm password field
   - "Create Account" button
3. Fill it in and click "Create Account"
4. Should redirect to `/mover/verify-email`

### Test Phase 2:
1. You should see "Check your email" page
2. Check your email inbox
3. Click the verification link
4. Should auto-redirect to `/mover/profile-completion`

### Test Phase 3:
1. You should see the FULL form with:
   - Company info (name, SIRET, phone, etc.)
   - Manager info (name, phone, ID documents)
   - Document uploads (KBIS, insurance, license)
   - Trucks
2. Fill everything and submit
3. Should redirect to `/mover/signup-success`

## What Each File Does

### Phase 1: `MoverEmailSignup.tsx`
- Simple form: email + password
- Calls `supabase.auth.signUp()`
- Creates signup intent record
- Redirects to email verification

### Phase 2: `MoverVerifyEmailPage.tsx`
- Shows "Check your email" message
- Auto-checks every 3 seconds if email verified
- Resend email button
- Auto-redirects when verified

### Phase 3: `MoverSignupPage.tsx` (Profile Completion)
- **No email/password fields** (already done)
- **No authentication** (already signed in)
- Checks user is authenticated
- Checks email is verified
- Company info form
- Document uploads
- Creates mover record

### Router: `Router.tsx`
- `/mover/signup` → Phase 1
- `/mover/verify-email` → Phase 2
- `/mover/profile-completion` → Phase 3

## Files in This Package

```
src/
├── components/
│   └── MoverEmailSignup.tsx        ← NEW (Phase 1)
├── pages/
│   ├── MoverVerifyEmailPage.tsx    ← NEW (Phase 2)
│   └── MoverSignupPage.tsx         ← REPLACED (Phase 3, no auth)
└── Router.tsx                      ← UPDATED (3 routes)

supabase/migrations/
└── two_phase_signup_migration.sql  ← Run this in SQL Editor
```

## Troubleshooting

### "Invalid login credentials" error
❌ **You're using the old Router.tsx**
✅ **Solution:** Your `/mover/signup` route must point to `MoverEmailSignup`, not `MoverSignupPage`

### Email not verified
❌ **Check your email inbox (and spam)**
✅ **Or disable email confirmation in Supabase Dashboard → Auth → Email**

### Can't access profile completion
❌ **Email not verified yet**
✅ **Click the link in your email first**

## Success Checklist

After setup, verify:

- [ ] `/mover/signup` shows SIMPLE email/password form (not full form)
- [ ] After signup, redirects to `/mover/verify-email`
- [ ] After email verification, redirects to `/mover/profile-completion`
- [ ] Profile completion shows FULL form (no email/password)
- [ ] No "Invalid login credentials" error
- [ ] No 400 Bad Request errors
- [ ] Can complete full signup flow

## Need Help?

If you see the old full form at `/mover/signup`:
1. Check Router.tsx imports
2. Verify route points to `MoverEmailSignup` not `MoverSignupPage`
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)

---

**This version WORKS. No more auth errors!** ✅
