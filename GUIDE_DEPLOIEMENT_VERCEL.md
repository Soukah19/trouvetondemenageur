# 🚀 Guide de Déploiement Vercel (Gratuit)

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   VERCEL (Gratuit)              SUPABASE (Gratuit)          │
│   ┌─────────────┐               ┌─────────────────┐         │
│   │   Frontend  │◄─────────────►│  Base de données │        │
│   │   React     │               │  Auth            │         │
│   │   (Vite)    │               │  Storage         │         │
│   └─────────────┘               │  Edge Functions  │         │
│                                 └─────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Vous déployez **seulement le frontend** sur Vercel. Supabase gère tout le backend.

---

## Étape 1: Préparer le Code

### 1.1 Créer un compte GitHub (si pas déjà fait)

1. Allez sur https://github.com
2. Créez un compte gratuit

### 1.2 Créer un Repository GitHub

1. Cliquez sur "New repository"
2. Nom: `trouveton-demenageur` (ou autre)
3. **Private** (recommandé)
4. Cliquez "Create repository"

### 1.3 Pousser votre code sur GitHub

```bash
# Dans le dossier de votre projet
cd votre-projet

# Initialiser Git (si pas déjà fait)
git init

# Ajouter le remote GitHub
git remote add origin https://github.com/VOTRE_USERNAME/trouveton-demenageur.git

# Créer le fichier .gitignore s'il n'existe pas
cat > .gitignore << 'EOF'
node_modules
dist
.env
.env.local
.env.*.local
*.log
.DS_Store
EOF

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "Initial commit"

# Pousser sur GitHub
git branch -M main
git push -u origin main
```

---

## Étape 2: Créer un Compte Vercel

1. Allez sur https://vercel.com
2. Cliquez **"Sign Up"**
3. Choisissez **"Continue with GitHub"** (le plus simple)
4. Autorisez Vercel à accéder à GitHub

---

## Étape 3: Importer le Projet

### 3.1 Nouveau Projet

1. Sur le dashboard Vercel, cliquez **"Add New..."** → **"Project"**
2. Sélectionnez votre repository GitHub `trouveton-demenageur`
3. Cliquez **"Import"**

### 3.2 Configurer le Build

Vercel détecte automatiquement Vite, mais vérifiez:

| Paramètre | Valeur |
|-----------|--------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 3.3 Configurer les Variables d'Environnement

**IMPORTANT!** Avant de déployer, ajoutez vos variables d'environnement:

1. Cliquez **"Environment Variables"** (section dépliable)
2. Ajoutez ces variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://bvvbkaluajgdurxnnqqu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Votre clé anon Supabase |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` ou `pk_live_...` |
| `VITE_GOOGLE_MAPS_API_KEY` | Votre clé Google Maps |
| `VITE_ENABLE_EMAIL_VERIFICATION` | `true` |

⚠️ **Note:** Les variables avec `VITE_` sont exposées au frontend, c'est normal pour celles-ci.

### 3.4 Déployer

Cliquez **"Deploy"**

Attendez 1-2 minutes...

✅ Votre site est live sur `https://votre-projet.vercel.app`

---

## Étape 4: Configurer le Domaine (Optionnel)

### Option A: Utiliser le domaine Vercel gratuit

Votre site est accessible sur: `https://trouveton-demenageur.vercel.app`

### Option B: Domaine personnalisé

1. Dans Vercel, allez dans **Settings** → **Domains**
2. Ajoutez votre domaine: `trouveton-demenageur.com`
3. Suivez les instructions DNS

---

## Étape 5: Configurer Supabase pour la Production

### 5.1 Mettre à jour les URLs autorisées

Dans **Supabase Dashboard** → **Authentication** → **URL Configuration**:

| Champ | Valeur |
|-------|--------|
| Site URL | `https://votre-projet.vercel.app` |
| Redirect URLs | `https://votre-projet.vercel.app/*` |

### 5.2 Configurer CORS (si nécessaire)

Les Edge Functions ont déjà les CORS configurés avec `*`. Si vous voulez restreindre:

Dans chaque fonction Edge, remplacez:
```typescript
"Access-Control-Allow-Origin": "*"
```
Par:
```typescript
"Access-Control-Allow-Origin": "https://votre-projet.vercel.app"
```

---

## Étape 6: Déployer les Edge Functions Supabase

Ces fonctions sont **hébergées sur Supabase**, pas sur Vercel.

### 6.1 Installer Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm (toutes plateformes)
npm install -g supabase
```

### 6.2 Se connecter

```bash
supabase login
```

### 6.3 Lier au projet

```bash
# Dans le dossier du projet
supabase link --project-ref bvvbkaluajgdurxnnqqu
```

### 6.4 Configurer les Secrets

```bash
# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_votre_cle_secrete

# OpenAI (pour l'analyse IA)
supabase secrets set OPENAI_API_KEY=sk-proj-votre_cle_openai

# Resend (pour les emails)
supabase secrets set RESEND_API_KEY=re_votre_cle_resend
```

### 6.5 Déployer les Fonctions

```bash
# Déployer toutes les fonctions
supabase functions deploy

# Ou une par une
supabase functions deploy create-payment-intent
supabase functions deploy analyze-mission-letter
supabase functions deploy analyze-damage-photo
```

---

## Étape 7: Vérifier le Déploiement

### Checklist

- [ ] Site accessible sur `https://votre-projet.vercel.app`
- [ ] Connexion fonctionne (Supabase Auth)
- [ ] Paiement test fonctionne (Stripe)
- [ ] Autocomplete adresse fonctionne (Google Maps)
- [ ] Edge functions répondent (tester dans la console)

### Tester une Edge Function

```bash
curl -X POST \
  'https://bvvbkaluajgdurxnnqqu.supabase.co/functions/v1/create-payment-intent' \
  -H 'Authorization: Bearer VOTRE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100, "quoteId": "test-123"}'
```

---

## 🆓 Limites du Plan Gratuit

### Vercel Free Tier

| Limite | Valeur |
|--------|--------|
| Bandwidth | 100 GB/mois |
| Builds | 6000 minutes/mois |
| Serverless Functions | 100 GB-hours/mois |
| Projets | Illimités |

✅ **Largement suffisant** pour un site en développement/lancement

### Supabase Free Tier

| Limite | Valeur |
|--------|--------|
| Database | 500 MB |
| Storage | 1 GB |
| Bandwidth | 2 GB |
| Edge Functions | 500K invocations/mois |
| Auth Users | Illimités |

✅ **Suffisant** pour commencer

---

## 🔄 Déploiements Automatiques

Une fois configuré, chaque `git push` sur `main` déclenche automatiquement un nouveau déploiement sur Vercel!

```bash
# Faire des modifications
git add .
git commit -m "Fix bug"
git push

# → Vercel redéploie automatiquement en ~1 minute
```

---

## 🛠️ Dépannage

### Erreur "Build failed"

1. Vérifiez les logs de build dans Vercel
2. Assurez-vous que `npm run build` fonctionne localement

### Variables d'environnement non trouvées

1. Vérifiez que les noms commencent par `VITE_`
2. Redéployez après avoir ajouté les variables

### CORS errors

1. Vérifiez les URLs dans Supabase Auth settings
2. Vérifiez les headers CORS dans les Edge Functions

### Edge Function timeout

1. Le plan gratuit a un timeout de 10 secondes
2. Optimisez vos fonctions si nécessaire

---

## 📝 Résumé des Commandes

```bash
# 1. Pousser sur GitHub
git add .
git commit -m "Deploy"
git push

# 2. Déployer les Edge Functions
supabase functions deploy

# 3. Voir les logs des fonctions
supabase functions logs create-payment-intent

# 4. Mettre à jour un secret
supabase secrets set NOM_SECRET=valeur
```

---

## ✅ C'est Tout!

Votre application est maintenant en production sur:
- **Frontend:** `https://votre-projet.vercel.app`
- **Backend:** Supabase (automatique)
- **Fonctions:** Supabase Edge Functions

Coût total: **0€** 🎉
