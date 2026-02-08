# 📦 Export Guide - TrouveTonDemenageur

Complete guide to export and deploy the entire project elsewhere.

## 🗂️ Project Structure

```
trouveton-demenageur/
├── src/                          # Frontend React application
├── supabase/
│   ├── migrations/               # Database schema migrations
│   └── functions/                # Edge Functions (backend)
├── public/                       # Static assets
├── package.json                  # Dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
└── .env                         # Environment variables
```

---

## 1️⃣ FRONTEND EXPORT

### Files to Export:
- `/src/**/*` - All React components and pages
- `/public/**/*` - Static assets
- `package.json` - Dependencies
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration
- `tsconfig.json` - TypeScript configuration
- `index.html` - Entry HTML file

### Dependencies Required:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}
```

### To Deploy Frontend:

#### Option A: Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Option B: Netlify
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

#### Option C: Any Static Host
```bash
npm run build
# Upload the 'dist' folder to your host
```

---

## 2️⃣ BACKEND EXPORT (Supabase Edge Functions)

### Files to Export:
- `/supabase/functions/**/*` - All Edge Functions

### Edge Functions List:
1. `analyze-damage-photo` - AI photo damage analysis
2. `analyze-furniture-photo` - AI furniture recognition
3. `analyze-mission-letter` - Document OCR analysis
4. `calculate-distance` - Google Maps distance calculation
5. `check-document-expiration` - Document validity checker
6. `comprehensive-mover-verification` - Mover verification system
7. `create-admin-accounts` - Admin account creation
8. `delete-auth-user` - User deletion utility
9. `export-damage-report-pdf` - PDF generation
10. `process-notification-queue` - Notification dispatcher
11. `reset-admin-passwords` - Password reset utility
12. `send-notification` - Email/SMS sender
13. `send-welcome-email` - Welcome email sender
14. `validate-payment-card` - Payment validation
15. `verify-document` - Document verification
16. `verify-dropit-documents` - Specific document checks
17. `verify-identity-document` - ID verification

### To Deploy Edge Functions:

#### Using Supabase CLI:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy

# Or deploy individual function
supabase functions deploy function-name
```

#### Alternative Deployment (Manual):
- Each function can be deployed via Supabase Dashboard
- Go to Edge Functions section
- Upload the function code
- Set environment variables

---

## 3️⃣ DATABASE EXPORT

### Files to Export:
- `/supabase/migrations/*.sql` - All migration files (89 total)

### Migration Files (Chronological Order):
All migrations are in `/supabase/migrations/` and should be applied in order.

### To Export Database Schema:

#### Option A: Via Supabase CLI
```bash
# Generate types
supabase gen types typescript --local > src/types/supabase.ts

# Export schema
supabase db dump -f schema.sql

# Export data (if needed)
supabase db dump --data-only -f data.sql
```

#### Option B: Via Supabase Dashboard
1. Go to Database → Migrations
2. Download all migration files
3. Or use SQL Editor to export schema

### To Import to New Supabase Project:
```bash
# Initialize new project
supabase init

# Copy migration files to supabase/migrations/

# Link to new project
supabase link --project-ref NEW_PROJECT_REF

# Run migrations
supabase db push

# Or apply manually via Dashboard SQL Editor
```

---

## 4️⃣ ENVIRONMENT VARIABLES

### Required `.env` Variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Maps API (for distance calculation)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Stripe (for payments)
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# OpenAI (for AI features)
OPENAI_API_KEY=your-openai-key

# Resend (for emails)
RESEND_API_KEY=your-resend-key
```

### Get Your Supabase Credentials:
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy `URL` and `anon/public` key

---

## 5️⃣ COMPLETE EXPORT COMMANDS

### Download Everything:
```bash
# If using Git
git clone <repository-url>
cd trouveton-demenageur

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Run locally
npm run dev

# Build for production
npm run build
```

---

## 6️⃣ MIGRATION TO NEW SUPABASE PROJECT

### Step-by-Step:

1. **Create New Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Save credentials

2. **Setup Database**
   ```bash
   # Apply all migrations in order
   # Either via CLI or Dashboard SQL Editor
   ```

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy
   ```

4. **Setup Storage Buckets**
   - Create buckets: `moving-photos`, `identity-documents`, `truck-photos`
   - Configure RLS policies (defined in migrations)

5. **Update Frontend Config**
   - Update `.env` with new Supabase credentials
   - Redeploy frontend

---

## 7️⃣ ALTERNATIVE: EXPORT TO ZIP

Would you like me to create a script to zip everything for download?

---

## 📊 Database Tables (Reference)

**Core Tables:**
- `admins` - Admin users
- `clients` - Client users
- `movers` - Moving company profiles
- `quote_requests` - Moving requests from clients
- `quotes` - Bids from movers
- `payments` - Payment transactions
- `refunds` - Refund records

**Supporting Tables:**
- `mover_documents` - Document uploads
- `mover_trucks` - Vehicle information
- `mover_availability` - Calendar availability
- `notifications` - User notifications
- `messages` - Chat system
- `reviews` - Ratings and reviews
- `favorites` - Saved movers
- `moving_photos` - Photo uploads
- `damage_reports` - Damage claims
- `contracts` - Electronic contracts
- `electronic_signatures` - Contract signatures
- `activity_logs` - Audit trail
- `fraud_alerts` - Security alerts

---

## 🚀 Quick Deploy Checklist

- [ ] Export all code files
- [ ] Copy all migration files
- [ ] Copy all edge functions
- [ ] Setup new Supabase project
- [ ] Apply database migrations
- [ ] Deploy edge functions
- [ ] Configure storage buckets
- [ ] Setup environment variables
- [ ] Deploy frontend
- [ ] Test all features
- [ ] Configure custom domain (optional)

---

## 📞 Need Help?

This export guide covers everything. If you need specific export formats or deployment help, let me know!
