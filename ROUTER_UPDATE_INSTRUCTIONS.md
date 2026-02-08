# SIMPLE FIX - Update Your Router

## Problem
Your Router.tsx is still using the old single-phase signup flow.

## Solution - Update Router.tsx

### Step 1: Add New Imports

**Add these lines after your existing imports:**

```typescript
import MoverEmailSignup from './components/MoverEmailSignup';
import MoverVerifyEmailPage from './pages/MoverVerifyEmailPage';
```

### Step 2: Find the Mover Signup Route

Look for this section (around line 503):

```typescript
<Route path="/mover/signup" element={
  <ConditionalAuthRoute requireAuth={false}>
    <MoverSignupPage />
  </ConditionalAuthRoute>
} />
```

### Step 3: REPLACE It With These 3 Routes

**Delete the old route and add these THREE routes:**

```typescript
{/* Phase 1: Email & Password Signup */}
<Route path="/mover/signup" element={
  <ConditionalAuthRoute requireAuth={false}>
    <MoverEmailSignup />
  </ConditionalAuthRoute>
} />

{/* Phase 2: Email Verification */}
<Route path="/mover/verify-email" element={
  <MoverVerifyEmailPage />
} />

{/* Phase 3: Profile Completion (after email verified) */}
<Route path="/mover/profile-completion" element={
  <ConditionalAuthRoute requireAuth={true}>
    <MoverSignupPage />
  </ConditionalAuthRoute>
} />
```

### Step 4: Keep the Success Route

**This route stays the same (no changes needed):**

```typescript
<Route path="/mover/signup-success" element={<MoverSignupSuccess />} />
```

## Complete Router Section (Copy This)

Here's the complete mover routes section you should have:

```typescript
{/* ===== MOVER ROUTES ===== */}

{/* Phase 1: Email & Password Signup */}
<Route path="/mover/signup" element={
  <ConditionalAuthRoute requireAuth={false}>
    <MoverEmailSignup />
  </ConditionalAuthRoute>
} />

{/* Phase 2: Email Verification */}
<Route path="/mover/verify-email" element={
  <MoverVerifyEmailPage />
} />

{/* Phase 3: Profile Completion */}
<Route path="/mover/profile-completion" element={
  <ConditionalAuthRoute requireAuth={true}>
    <MoverSignupPage />
  </ConditionalAuthRoute>
} />

{/* Success Page */}
<Route path="/mover/signup-success" element={<MoverSignupSuccess />} />

{/* Other mover routes... */}
<Route path="/mover/auth" element={<MoverAuthPage />} />
<Route path="/mover/dashboard" element={
  <ConditionalAuthRoute requireAuth={true}>
    <MoverDashboard />
  </ConditionalAuthRoute>
} />
```

## That's It!

After making these changes:
1. Save Router.tsx
2. Refresh your browser
3. Go to `/mover/signup`
4. You should now see the simple email/password form (NOT the full form)

## Flow After Fix

```
/mover/signup (email + password)
    ↓
Email sent to user
    ↓
/mover/verify-email (waiting for email verification)
    ↓
User clicks link in email
    ↓
/mover/profile-completion (company info + documents)
    ↓
/mover/signup-success
```
