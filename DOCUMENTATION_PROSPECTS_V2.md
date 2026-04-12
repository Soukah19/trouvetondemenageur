# 📋 Documentation des modifications — Prospects V2

## Vue d'ensemble

Cette mise à jour ajoute 5 fonctionnalités majeures au système de prospects de TrouveTonDéménageur.

---

## 1. Réduction des champs obligatoires à l'import (Déménageurs)

**Fichiers modifiés :**
- `src/components/admin/ImportMoversModal.tsx` — Réécrit

**Avant :** L'import exigeait de nombreux champs.
**Après :** Seulement 3 champs obligatoires :
- `RAISON_SOCIALE` (nom de l'entreprise)
- `EMAIL`
- `SIRET`

Tous les autres champs (téléphone, adresse, ville, dirigeants, etc.) sont **optionnels**. Le déménageur invité pourra compléter les données manquantes lors de son inscription.

**Nouveau :** Un flag `has_phone` est automatiquement calculé pour chaque prospect (= `true` si `TELEPHONE` ou `MOBILE` est présent).

---

## 2. Vérification des emails existants à l'import

**Fichiers modifiés :**
- `src/components/admin/ImportMoversModal.tsx`
- `supabase/functions/create-invited-mover/index.ts`

**À l'import :** Avant d'insérer, le système vérifie :
- La table `mover_prospects` (doublons de prospects)
- La table `movers` (déjà inscrit sur la plateforme)
Les doublons sont comptés et affichés mais pas insérés.

**À l'inscription (create-invited-mover) :** Avant de créer un compte auth :
- Vérifie si l'email existe dans la table `movers`
- Si l'utilisateur existe dans `auth.users` mais n'a pas de profil mover, réutilise le compte auth existant
- Élimine l'erreur 409 "already_exists"

---

## 3. Onglet "Sans téléphone" pour les déménageurs

**Fichiers modifiés :**
- `src/components/admin/AdminMoverProspects.tsx` — Réécrit
- `supabase/functions/send-prospect-discovery-email/index.ts` — **NOUVEAU**

**Fonctionnement :**
- Nouvel onglet "Sans téléphone" dans la page Prospects Déménageurs
- Ces prospects reçoivent un **email de découverte** (pas d'invitation avec inscription pré-remplie)
- L'email les dirige vers `https://www.trouvetondemenageur.fr` pour s'inscrire manuellement s'ils le souhaitent
- **Sélection multiple** : checkbox individuelle + "Tout sélectionner"
- **Envoi en masse** avec rate limiting (Resend free tier)
- Badges : "Email envoyé" (vert), bouton "Renvoyer"
- L'email envoyé est tracké avec `discovery_email_sent` + `discovery_email_sent_at`

**Rate limiting Resend :**
- Free tier : 2 emails/seconde, 100 emails/jour
- Le code attend 600ms entre chaque envoi
- Maximum 50 emails par action bulk
- ⚠️ Si vous dépassez 100 emails/jour, il faudra passer à Resend Pro (~$20/mois pour 50K emails/mois)

---

## 4. Notification aux admins quand un déménageur accepte l'invitation

**Fichiers modifiés :**
- `supabase/functions/create-invited-mover/index.ts` — Mis à jour

**Fonctionnement :**
Quand un déménageur finalise son inscription via le lien d'invitation :
1. **Notification in-app** créée pour TOUS les admins (toutes les rôles : super_admin, admin_agent, admin, support)
2. **Email** envoyé à chaque admin avec un lien vers la page "Déménageurs en Attente"
3. Type de notification : `mover_registration`
4. Les emails admin sont envoyés avec un délai de 600ms entre chaque (rate limiting)

---

## 5. Import de fichiers clients

**Fichiers créés :**
- `src/components/admin/AdminClientProspects.tsx` — **NOUVEAU**
- `src/components/admin/ImportClientsModal.tsx` — **NOUVEAU**

**Colonnes du fichier client :**
- `email` (obligatoire)
- `nom` (optionnel)
- `prenom` (optionnel)
- `telephone` (optionnel)

**Fonctionnement identique aux déménageurs :**
- Import Excel/CSV
- Vérification des doublons
- Flag `has_phone` automatique
- 2 onglets principaux : "Avec téléphone" (à appeler) et "Sans téléphone" (envoi d'emails)
- Sélection multiple + envoi en masse
- Email de découverte différent (orienté client : "Simplifiez votre déménagement")
- Badge "Email envoyé" + "Renvoyer"

**Navigation :** Nouvel onglet "Prospects Clients" dans le menu admin (couleur violet/rose).

---

## Fichiers créés / modifiés

### Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `supabase/migrations/20260218000001_prospects_system_v2.sql` | Migration DB : `client_prospects` table + colonnes `has_phone`, `discovery_email_sent` |
| `supabase/functions/send-prospect-discovery-email/index.ts` | Edge function : emails de découverte (mover + client) |
| `supabase/functions/notify-admins-mover-signup/index.ts` | Edge function : notification admins (standalone, optionnel) |
| `src/components/admin/AdminClientProspects.tsx` | Composant admin prospects clients |
| `src/components/admin/ImportClientsModal.tsx` | Modal import fichiers clients |

### Fichiers modifiés
| Fichier | Modifications |
|---------|--------------|
| `src/components/admin/ImportMoversModal.tsx` | Réécrit : 3 champs obligatoires, has_phone, vérif doublons |
| `src/components/admin/AdminMoverProspects.tsx` | Réécrit : onglet "Sans tél", bulk email, discovery emails |
| `src/pages/AdminDashboard.tsx` | Ajout onglet client_prospects, nav items |
| `src/pages/MoverInviteSignupPage.tsx` | Message d'aide quand tél manquant |
| `supabase/functions/create-invited-mover/index.ts` | Vérif email existant + notifications admins |

---

## Déploiement

### 1. Migration SQL
```bash
# Appliquer via Supabase Dashboard > SQL Editor
# ou via CLI :
supabase db push
```
Le fichier `20260218000001_prospects_system_v2.sql` crée :
- La table `client_prospects`
- Les colonnes `has_phone`, `discovery_email_sent`, `discovery_email_sent_at` sur `mover_prospects`
- Les index et policies RLS

### 2. Edge Functions
Déployer les nouvelles/mises à jour edge functions :
```bash
supabase functions deploy send-prospect-discovery-email
supabase functions deploy create-invited-mover
supabase functions deploy notify-admins-mover-signup  # optionnel
```

### 3. Frontend
```bash
npm run build
```

---

## ⚠️ Limites Resend (Free Tier)

| Limite | Valeur |
|--------|--------|
| Emails/seconde | 2 |
| Emails/jour | 100 |
| Emails/mois | 3,000 |

**Le code implémente :**
- Délai de 600ms entre chaque email
- Maximum 50 emails par action bulk
- Messages d'avertissement affichés à l'admin

**Si vous avez besoin de plus :**
- **Resend Pro** : ~$20/mois pour 50,000 emails/mois
- Permet d'envoyer 10 emails/seconde
- Recommandé si vous importez régulièrement des fichiers > 100 prospects
