# ✅ UPDATED: Email Verification with CODE (Not Link)

## What Changed

Your Supabase is configured to send **verification codes** (8-digit numbers) instead of magic links.

The email looks like:
```
Confirmez votre inscription
Merci de vous être inscrit sur TrouveTonDemenageur. 
Utilisez le code ci-dessous pour confirmer votre adresse email.

48174885

Ce code est valable pour une durée limitée.
```

## What I Updated

### MoverVerifyEmailPage.tsx

**Before:**
- Showed "Click the link in your email"
- Auto-checked every 3 seconds for verification
- Expected user to click a magic link

**After:**
- Shows input field for 8-digit code
- User enters code manually
- Calls `supabase.auth.verifyOtp()` to verify
- Redirects after successful verification

## New User Flow

```
1. User signs up at /mover/signup
   ↓
2. Email sent with 8-digit CODE (not link)
   ↓
3. User goes to /mover/verify-email
   ↓
4. User sees input field for code
   ↓
5. User enters: 48174885
   ↓
6. Click "Vérifier le code"
   ↓
7. ✓ Verified! Redirects to /mover/profile-completion
```

## The New Verification Page UI

```
┌─────────────────────────────────┐
│     📧 Vérifiez votre email     │
│                                 │
│ Code de vérification:           │
│ ┌─────────────────────────────┐ │
│ │       12345678              │ │ <- Input field
│ └─────────────────────────────┘ │
│                                 │
│ [✓ Vérifier le code]            │
│                                 │
│ [📧 Renvoyer le code]           │
│ [Retour à la connexion]         │
└─────────────────────────────────┘
```

## Key Changes in Code

### 1. Added State for Code
```typescript
const [verificationCode, setVerificationCode] = useState('');
const [verifying, setVerifying] = useState(false);
```

### 2. Added Verification Function
```typescript
const handleVerifyCode = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const { data, error } = await supabase.auth.verifyOtp({
    email: email,
    token: verificationCode,
    type: 'email'
  });
  
  if (data.user) {
    // Success! Redirect to profile completion
    navigate('/mover/profile-completion');
  }
};
```

### 3. Added Code Input Field
```typescript
<input
  type="text"
  value={verificationCode}
  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
  placeholder="12345678"
  maxLength={8}
  className="text-center text-2xl font-mono tracking-wider"
/>
```

## Features

✅ **Only accepts numbers** - Automatically filters out non-digits  
✅ **8 digits max** - Can't enter more than 8 characters  
✅ **Large centered text** - Easy to read the code  
✅ **Mono font** - Better for code display  
✅ **Disabled until 8 digits** - Button only works with complete code  
✅ **Loading state** - Shows spinner while verifying  
✅ **Resend code** - User can request new code  

## Testing

1. **Signup:**
   ```
   Go to /mover/signup
   Enter: test@example.com / password123
   Click "Create Account"
   ```

2. **Check Email:**
   ```
   Open email inbox
   Find email from TrouveTonDemenageur
   Copy the 8-digit code (e.g., 48174885)
   ```

3. **Verify:**
   ```
   Should be on /mover/verify-email
   Enter the 8-digit code
   Click "Vérifier le code"
   Should redirect to /mover/profile-completion
   ```

## Error Handling

- ❌ **Invalid code:** Shows "Code invalide ou expiré"
- ❌ **Wrong length:** Button disabled until 8 digits
- ❌ **Expired code:** User can click "Renvoyer le code"
- ✅ **Success:** Shows success message and redirects

## Supabase Configuration

Your Supabase is already configured correctly:
- Email provider: Enabled ✓
- Email verification: Required ✓
- Verification method: OTP Code (not magic link) ✓

**No Supabase changes needed!**

## Files Updated

- `src/pages/MoverVerifyEmailPage.tsx` - Complete rewrite for code verification

## Use This Version

**`demenageur_app_WITH_CODE_VERIFICATION.zip`**

This version:
- ✅ Has code verification input
- ✅ Works with your current Supabase setup
- ✅ All previous fixes included
- ✅ Ready to use!

---

**Now users enter the code from their email instead of clicking a link!** 🎯
