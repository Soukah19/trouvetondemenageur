# CONFIGURATION STRIPE - GUIDE RAPIDE

Si tu veux tester les PAIEMENTS, voici comment configurer Stripe en 5 minutes.

---

## ETAPE 1: CREER COMPTE STRIPE

1. Aller sur: https://dashboard.stripe.com/register
2. Créer un compte (gratuit)
3. Vérifier email

---

## ETAPE 2: OBTENIR LES CLES API TEST

1. Aller sur: https://dashboard.stripe.com/test/apikeys
2. Tu verras 2 clés:
   - **Publishable key** (commence par `pk_test_...`)
   - **Secret key** (commence par `sk_test_...`)
3. Copier les 2 clés

---

## ETAPE 3: AJOUTER DANS .ENV

Editer le fichier `.env` dans le projet:

```bash
# Remplacer ces lignes:
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# Par:
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXX
```

**IMPORTANT:** Utiliser les clés **TEST** (pk_test_ et sk_test_), pas les clés LIVE!

---

## ETAPE 4: REDEMARRER LE SERVEUR

```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

---

## ETAPE 5: TESTER PAIEMENT

### Cartes de test Stripe:

**Succès:**
```
Numéro: 4242 4242 4242 4242
Date: 12/34
CVC: 123
Code postal: 75001
```

**Échec (carte refusée):**
```
Numéro: 4000 0000 0000 0002
Date: 12/34
CVC: 123
```

**Nécessite authentification:**
```
Numéro: 4000 0027 6000 3184
Date: 12/34
CVC: 123
```

Plus de cartes test: https://stripe.com/docs/testing

---

## VERIFICATION

1. Client accepte devis
2. Redirige vers page paiement
3. Formulaire Stripe s'affiche ✅
4. Entrer carte test
5. Paiement réussi
6. Payment créé en base (status: escrow)

---

## IMPORTANT

- **TEST:** Toujours clés `pk_test_` et `sk_test_`
- **PRODUCTION:** Clés `pk_live_` et `sk_live_` (plus tard)
- **SECURITE:** JAMAIS commit les clés dans Git
- **CARTES:** Toujours cartes test en dev

---

## SI PROBLEMES

**Erreur "Stripe not configured":**
- Vérifier .env a les 2 clés
- Vérifier clés commencent par pk_test_ et sk_test_
- Redémarrer serveur

**Formulaire ne charge pas:**
- Vérifier console navigateur (F12)
- Vérifier clé publishable correcte
- Vérifier connexion internet

**Paiement refusé:**
- Vérifier carte test correcte
- Vérifier clé secret correcte
- Voir logs Stripe Dashboard

---

## DASHBOARD STRIPE

Après paiement test, voir dans Dashboard:
- https://dashboard.stripe.com/test/payments
- Tu verras tous les paiements test
- Montants, statuts, détails

---

**Durée totale: 5 minutes**
**Difficulté: Facile**

Date: 2026-01-07
