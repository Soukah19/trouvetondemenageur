# TrouveTonDemenageur - Production Ready Version

## ✨ Features Included

### Two-Phase Signup System
✅ Email & password signup (Phase 1)  
✅ Email verification with 8-digit code (Phase 2)  
✅ Profile completion with documents (Phase 3)  

### Fixed Issues
✅ All RLS authentication errors resolved  
✅ Proper import/export statements  
✅ Email verification with code (not link)  
✅ Type safety for all components  
✅ Clean routing structure  

### What Works
✅ Mover signup with document upload  
✅ Client signup and quote requests  
✅ Admin dashboard  
✅ Payment integration (Stripe ready)  
✅ Messaging system  
✅ Review and rating system  

---

## 🚀 Quick Start (5 Minutes)

### Windows Users

**Double-click:** `start.bat`

That's it! The script will:
- Clean old cache
- Install dependencies
- Start the server

### Mac/Linux Users

```bash
# Make script executable (first time only)
chmod +x start.sh

# Run it
./start.sh
```

### Manual Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Server starts at: **http://localhost:5173**

---

## 📋 Setup Checklist

### 1. Database Setup (5 minutes)

**Run this SQL in Supabase SQL Editor:**

See file: `SETUP_GUIDE_FINAL.md` → Section "Database Setup"

Or run: `supabase/migrations/two_phase_signup_migration.sql`

This creates:
- `mover_signup_progress` table
- `create_mover_signup_intent()` function
- `update_mover_signup_profile()` function  
- `complete_mover_signup()` function

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
```

### 3. Test the Application

**Phase 1: Signup**
```
1. Go to http://localhost:5173/mover/signup
2. Enter email and password
3. Click "Create Account"
```

**Phase 2: Verify Email**
```
4. Check email inbox
5. Copy 8-digit code (e.g., 48174885)
6. Enter code on verification page
7. Click "Verify Code"
```

**Phase 3: Complete Profile**
```
8. Fill company information
9. Upload documents (KBIS, insurance, license)
10. Add trucks
11. Submit
```

**Success!**
```
12. Redirected to success page
13. Check database - mover record created
```

---

## 📁 Project Structure

```
demenageur_app/
├── src/
│   ├── components/
│   │   ├── MoverEmailSignup.tsx          ← Phase 1
│   │   ├── DocumentUploadInput.tsx
│   │   ├── MultiDocumentUploadInput.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── MoverVerifyEmailPage.tsx      ← Phase 2 (with code input)
│   │   ├── MoverSignupPage.tsx           ← Phase 3 (profile completion)
│   │   ├── LandingPage.tsx
│   │   └── ...
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   └── Router.tsx                        ← 3-phase routes configured
├── supabase/
│   └── migrations/
│       └── two_phase_signup_migration.sql
├── start.bat                             ← Windows startup script
├── start.sh                              ← Mac/Linux startup script
├── package.json
└── README.md                             ← This file
```

---

## 🔧 Troubleshooting

### Issue: 404 Error on localhost

**Solution:**
```bash
# Stop server (Ctrl+C)
# Delete cache
rm -rf node_modules/.vite  # Mac/Linux
rmdir /s node_modules\.vite  # Windows

# Restart
npm run dev

# Hard refresh browser
Ctrl + Shift + R
```

### Issue: "Invalid login credentials"

This means you're using the old single-phase flow.

**Solution:** Make sure Router.tsx has these routes:
```typescript
<Route path="/mover/signup" element={<MoverEmailSignup />} />
<Route path="/mover/verify-email" element={<MoverVerifyEmailPage />} />
<Route path="/mover/profile-completion" element={<MoverSignupPage />} />
```

### Issue: Import/Export Errors

**Solution:**
```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
```

### Issue: Email Code Not Working

**Verify Supabase Settings:**
1. Go to Supabase Dashboard
2. Authentication → Providers → Email
3. Check "Enable email confirmations" is ON
4. Verification method should be "OTP" (not magic link)

---

## 🎯 Key Files to Understand

### Router Configuration
**File:** `src/Router.tsx`
```typescript
// Three separate routes for signup flow:
/mover/signup          → MoverEmailSignup
/mover/verify-email    → MoverVerifyEmailPage  
/mover/profile-completion → MoverSignupPage
```

### Phase 1: Email Signup
**File:** `src/components/MoverEmailSignup.tsx`
- Simple email/password form
- Calls `supabase.auth.signUp()`
- Creates signup intent in database
- Redirects to verification page

### Phase 2: Email Verification
**File:** `src/pages/MoverVerifyEmailPage.tsx`
- Input field for 8-digit code
- Calls `supabase.auth.verifyOtp()`
- Redirects to profile completion when verified

### Phase 3: Profile Completion
**File:** `src/pages/MoverSignupPage.tsx`
- Full form: company info + documents
- Uploads to Supabase Storage
- Calls `complete_mover_signup()` function
- Creates mover record in database

---

## 📊 Database Functions

### create_mover_signup_intent(p_email)
Creates initial signup record after email/password signup.

### update_mover_signup_profile(...)
Saves company information during profile completion.

### complete_mover_signup()
- Validates email is verified
- Creates actual mover record
- Deletes progress record (cleanup)

---

## 🔐 Security Features

✅ **Row Level Security (RLS)** enabled on all tables  
✅ **Email verification required** before profile completion  
✅ **User ownership validation** in all operations  
✅ **Secure file uploads** with proper RLS policies  
✅ **No service role exposure** in frontend  

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output in `dist/` folder.

### Environment Variables for Production

Set these in your hosting platform:

```
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
```

### Deploy to Vercel/Netlify

1. Push code to GitHub
2. Connect repository in Vercel/Netlify
3. Set environment variables
4. Deploy!

---

## 📚 Documentation Files

- **SETUP_GUIDE_FINAL.md** - Complete setup instructions
- **CODE_VERIFICATION_UPDATE.md** - Email verification details
- **TWO_PHASE_SIGNUP_GUIDE.md** - Architecture explanation
- **FIX_404_ERROR.md** - Troubleshooting guide
- **ALL_ERRORS_FIXED.md** - List of resolved issues

---

## 🆘 Need Help?

### Common Commands

```bash
# Clean start
npm run dev

# Clean install
rm -rf node_modules && npm install

# Build production
npm run build

# Type check
npm run typecheck

# Lint code
npm run lint
```

### File Issues?

1. Check imports/exports are correct
2. Clear .vite cache
3. Restart dev server
4. Hard refresh browser (Ctrl+Shift+R)

### Database Issues?

1. Check Supabase connection
2. Verify RLS policies exist
3. Test SQL functions in Supabase SQL Editor
4. Check environment variables

---

## ✅ Success Checklist

Before going to production:

- [ ] Database migration ran successfully
- [ ] Environment variables configured
- [ ] Mover signup works (all 3 phases)
- [ ] Client signup works
- [ ] Admin login works
- [ ] Document uploads work
- [ ] Email verification works
- [ ] No console errors
- [ ] No 404 errors
- [ ] All routes accessible

---

## 📞 Support

If you encounter issues:

1. Check the documentation files
2. Review error messages in browser console
3. Check Supabase logs (Dashboard → Database → Logs)
4. Verify all environment variables are set
5. Make sure database migration completed

---

**Version:** 3.0 - Two-Phase Signup with Code Verification  
**Date:** January 30, 2026  
**Status:** Production Ready ✅

🎉 **Ready to launch!**
