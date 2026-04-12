#!/bin/bash

# TrouveTonDemenageur - Complete Export Script
# This script creates a complete export of the project

echo "🚀 Starting TrouveTonDemenageur Export..."

# Create export directory with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_DIR="trouveton_export_${TIMESTAMP}"
mkdir -p "$EXPORT_DIR"

echo "📁 Creating export directory: $EXPORT_DIR"

# 1. Export Frontend
echo "📦 Exporting Frontend..."
mkdir -p "$EXPORT_DIR/frontend"
cp -r src "$EXPORT_DIR/frontend/"
cp -r public "$EXPORT_DIR/frontend/"
cp package.json "$EXPORT_DIR/frontend/"
cp package-lock.json "$EXPORT_DIR/frontend/"
cp vite.config.ts "$EXPORT_DIR/frontend/"
cp tailwind.config.js "$EXPORT_DIR/frontend/"
cp postcss.config.js "$EXPORT_DIR/frontend/"
cp tsconfig.json "$EXPORT_DIR/frontend/"
cp tsconfig.app.json "$EXPORT_DIR/frontend/"
cp tsconfig.node.json "$EXPORT_DIR/frontend/"
cp index.html "$EXPORT_DIR/frontend/"
cp .env.example "$EXPORT_DIR/frontend/"
cp .gitignore "$EXPORT_DIR/frontend/"
echo "✅ Frontend exported"

# 2. Export Backend (Edge Functions)
echo "⚡ Exporting Backend (Edge Functions)..."
mkdir -p "$EXPORT_DIR/backend"
cp -r supabase/functions "$EXPORT_DIR/backend/"
echo "✅ Backend exported"

# 3. Export Database Migrations
echo "🗄️ Exporting Database Migrations..."
mkdir -p "$EXPORT_DIR/database"
cp -r supabase/migrations "$EXPORT_DIR/database/"
echo "✅ Database migrations exported"

# 4. Export Documentation
echo "📚 Exporting Documentation..."
mkdir -p "$EXPORT_DIR/docs"
cp *.md "$EXPORT_DIR/docs/" 2>/dev/null || true
echo "✅ Documentation exported"

# 5. Create README for export
cat > "$EXPORT_DIR/README.md" << 'EOF'
# TrouveTonDemenageur - Complete Export

This export contains the complete TrouveTonDemenageur project.

## 📦 Contents

- `frontend/` - React + TypeScript frontend application
- `backend/` - Supabase Edge Functions
- `database/` - PostgreSQL migration files
- `docs/` - Project documentation

## 🚀 Quick Start

### 1. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Setup Database

- Create a Supabase project at https://supabase.com
- Apply all migrations in `database/migrations/` in order
- Or use Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 3. Deploy Edge Functions

```bash
cd backend/functions
# Deploy each function via Supabase Dashboard or CLI
supabase functions deploy
```

### 4. Configure Environment Variables

Edit `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

## 📖 Full Documentation

See `docs/EXPORT_GUIDE.md` for complete deployment instructions.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth

## 📞 Support

For questions about this export, refer to the documentation files.
EOF

echo "✅ README created"

# 6. Create deployment guide
cat > "$EXPORT_DIR/DEPLOYMENT.md" << 'EOF'
# 🚀 Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Google Maps API key (for distance calculation)
- Stripe account (for payments)
- Resend account (for emails)
- OpenAI API key (for AI features)

## Step 1: Deploy Database

1. Create new Supabase project
2. Go to SQL Editor
3. Execute migrations in order from `database/migrations/`

## Step 2: Deploy Backend

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_REF`
4. Deploy functions: `supabase functions deploy`

## Step 3: Deploy Frontend

### Option A: Vercel
```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Option B: Netlify
```bash
cd frontend
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Option C: Self-hosted
```bash
cd frontend
npm install
npm run build
# Upload 'dist' folder to your server
```

## Step 4: Configure Storage

In Supabase Dashboard:
1. Go to Storage
2. Create buckets:
   - `moving-photos`
   - `identity-documents`
   - `truck-photos`
3. RLS policies are already in migrations

## Step 5: Test

1. Visit your deployed frontend URL
2. Test registration (client & mover)
3. Create a quote request
4. Submit a quote
5. Test payment flow

## 🎉 Done!

Your platform is now live!
EOF

echo "✅ Deployment guide created"

# 7. Create a summary file
cat > "$EXPORT_DIR/EXPORT_SUMMARY.txt" << EOF
TrouveTonDemenageur - Export Summary
Generated: $(date)

FRONTEND FILES:
- Source code: $(find "$EXPORT_DIR/frontend/src" -type f | wc -l) files
- Components: $(find "$EXPORT_DIR/frontend/src/components" -type f 2>/dev/null | wc -l) files
- Pages: $(find "$EXPORT_DIR/frontend/src/pages" -type f 2>/dev/null | wc -l) files

BACKEND FILES:
- Edge Functions: $(find "$EXPORT_DIR/backend/functions" -type d -depth 1 2>/dev/null | wc -l) functions

DATABASE FILES:
- Migrations: $(find "$EXPORT_DIR/database/migrations" -type f -name "*.sql" 2>/dev/null | wc -l) files

DOCUMENTATION FILES:
- Docs: $(find "$EXPORT_DIR/docs" -type f 2>/dev/null | wc -l) files

TOTAL SIZE: $(du -sh "$EXPORT_DIR" | cut -f1)

NEXT STEPS:
1. Review EXPORT_GUIDE.md for detailed instructions
2. Follow DEPLOYMENT.md for deployment steps
3. Configure environment variables
4. Test all features after deployment

EOF

echo "✅ Summary created"

# 8. Create archive
echo "📦 Creating ZIP archive..."
zip -r "${EXPORT_DIR}.zip" "$EXPORT_DIR" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Archive created: ${EXPORT_DIR}.zip"
    echo "📊 Archive size: $(du -sh "${EXPORT_DIR}.zip" | cut -f1)"
else
    echo "⚠️  ZIP creation failed (zip command not available)"
    echo "💡 You can manually zip the folder: $EXPORT_DIR"
fi

echo ""
echo "✨ Export Complete!"
echo ""
echo "📁 Export location: $EXPORT_DIR"
echo "📦 Archive: ${EXPORT_DIR}.zip"
echo ""
echo "📖 Next steps:"
echo "   1. Review $EXPORT_DIR/EXPORT_GUIDE.md"
echo "   2. Follow $EXPORT_DIR/DEPLOYMENT.md"
echo "   3. Configure environment variables"
echo ""
echo "🎉 Ready to deploy!"
