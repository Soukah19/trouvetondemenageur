# 🧪 GUIDE DE TEST STRIPE - Mode Test Complet

## Ce que tu vas tester
1. **Paiement** - Client paie l'acompte avec une carte test
2. **Remboursement** - Admin rembourse le client via Stripe
3. **Virement déménageur** - Admin libère la garantie au déménageur

---

## PRÉREQUIS (à faire une seule fois)

### A. Obtenir tes clés Stripe TEST

1. Va sur **https://dashboard.stripe.com/test/apikeys**
2. Copie ta **Publishable key** → commence par `pk_test_...`
3. Copie ta **Secret key** → commence par `sk_test_...`

### B. Configurer les clés

**Dans ton fichier `.env` (frontend) :**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SlQUo...VOTRE_CLE_TEST
```

**Dans Supabase Dashboard (Edge Functions secrets) :**
- Va dans **Settings > Edge Functions > Manage Secrets**
- Ajoute/modifie : `STRIPE_SECRET_KEY` = `sk_test_51SlQUo...VOTRE_CLE_TEST`

### C. Exécuter la migration SQL

Va dans **Supabase Dashboard > SQL Editor** et exécute le contenu du fichier :
```
supabase/migrations/20260228000000_add_stripe_refund_and_payout_columns.sql
```

### D. Déployer les Edge Functions

```bash
npx supabase functions deploy create-payment-intent
npx supabase functions deploy stripe-webhook
npx supabase functions deploy process-refund
npx supabase functions deploy transfer-to-mover
```

### E. Configurer le Webhook (pour recevoir les confirmations)

1. Va sur **https://dashboard.stripe.com/test/webhooks**
2. Clique **+ Ajouter un endpoint**
3. URL : `https://bvvbkaluajgdurxnnqqu.supabase.co/functions/v1/stripe-webhook`
4. Événements à écouter :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copie le **Signing secret** (`whsec_...`)
6. Ajoute-le dans **Supabase Secrets** : `STRIPE_WEBHOOK_SECRET` = `whsec_...`

---

## TEST 1 : PAIEMENT CLIENT ✅

### Étapes :

1. **Connecte-toi en tant que client** sur ton app
2. **Trouve un devis en statut "pending"** (ou crée une demande et fais qu'un déménageur envoie un devis)
3. **Clique "Accepter et Payer"** pour aller sur la page de paiement
4. **Remplis le formulaire Stripe Elements** avec une carte TEST :

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Succès | `4242 4242 4242 4242` | ✅ Paiement réussi |
| Refusée | `4000 0000 0000 0002` | ❌ Carte refusée |
| 3D Secure | `4000 0025 0000 3155` | 🔐 Demande authentification |
| Fonds insuffisants | `4000 0000 0000 9995` | ❌ Fonds insuffisants |

- **Date expiration** : n'importe quelle date future (ex: `12/34`)
- **CVC** : n'importe quel nombre à 3 chiffres (ex: `123`)

5. **Clique Payer**

### Ce qui doit se passer :
- ✅ Le formulaire Stripe traite le paiement
- ✅ Tu es redirigé vers la page de succès
- ✅ Le devis passe en statut "accepted"
- ✅ La demande passe en statut "accepted" avec payment_status = "deposit_paid"
- ✅ Un enregistrement apparaît dans la table `payments` avec un vrai `stripe_payment_id` (commence par `pi_`)

### Vérification :
- **Stripe Dashboard** : https://dashboard.stripe.com/test/payments → tu dois voir le paiement
- **Supabase** : table `payments` → `stripe_payment_id` = `pi_3...` (pas `pi_test_`)
- **Supabase** : table `payments` → `payment_status` = `completed`

---

## TEST 2 : REMBOURSEMENT CLIENT 💰

### Étapes :

1. **Connecte-toi en tant qu'admin**
2. **Va dans Gestion Financière**
3. **Trouve le paiement** que tu viens de faire dans TEST 1
4. **Clique sur "Rembourser"** et remplis :
   - Montant : le montant de l'acompte (ou un montant partiel)
   - Raison : "Test remboursement"
5. **Le remboursement est créé** en statut "pending"
6. **Va dans l'onglet Remboursements**
7. **Clique "Approuver"** sur le remboursement

### Ce qui doit se passer :
- ✅ Un appel est fait à la Edge Function `process-refund`
- ✅ Stripe traite le remboursement réel
- ✅ Un toast apparaît avec l'ID du remboursement Stripe (`re_...`)
- ✅ Le statut du remboursement passe à "completed"
- ✅ Le paiement passe en "refunded_full" ou "refunded_partial"

### Vérification :
- **Stripe Dashboard** : https://dashboard.stripe.com/test/payments → clique sur le paiement → tu dois voir le remboursement
- **Supabase** : table `refunds` → `stripe_refund_id` = `re_...`
- **Supabase** : table `payments` → `payment_status` = `refunded_full`

---

## TEST 3 : VIREMENT DÉMÉNAGEUR (Garantie) 🏦

### Prérequis :
- Refais un TEST 1 (nouveau paiement) car le précédent est remboursé
- Assure-toi que le déménageur a un IBAN dans son profil (table `movers`)

### Étapes :

1. **Connecte-toi en tant qu'admin**
2. **Va dans Gestion Financière > Paiements**
3. **Trouve le nouveau paiement**
4. **Clique sur "Garantie"** (le bouton pour décider de la garantie)
5. **Choisis "Restitution totale au déménageur"**
6. **Ajoute une note** : "Test virement déménageur"
7. **Confirme**

### Ce qui doit se passer :
- ✅ La garantie passe en statut "released_to_mover"
- ✅ La Edge Function `transfer-to-mover` est appelée
- ✅ Un toast affiche les détails bancaires du déménageur (IBAN, nom)
- ✅ Le `mover_payout_status` passe à "ready_to_pay"
- ✅ Le déménageur reçoit une notification

### Vérification :
- **Supabase** : table `payments` → `mover_payout_status` = `ready_to_pay`
- **Supabase** : table `payments` → `mover_payout_amount` = montant de la garantie
- **Supabase** : table `notifications` → notification envoyée au déménageur

> **Note :** En mode SEPA manuel, le virement réel est fait manuellement depuis ton
> compte bancaire. Le système ne fait que tracker. Avec Stripe Connect (futur), le
> virement serait automatique.

---

## SCÉNARIOS DE TEST AVANCÉS

### Test paiement échoué
- Utilise la carte `4000 0000 0000 0002`
- Vérifie que le paiement est marqué "failed" et le devis revient en "pending"

### Test remboursement partiel
- Fais un paiement de 520€ d'acompte
- Rembourse seulement 200€
- Vérifie que payment_status = "refunded_partial"

### Test garantie partielle
- Lors de la décision garantie, choisis "Restitution partielle"
- Mets un montant inférieur à la garantie totale
- Vérifie que guarantee_status = "partial_release"

### Test sans IBAN déménageur
- Supprime temporairement l'IBAN du déménageur
- Essaie de libérer la garantie
- Vérifie que tu reçois l'erreur "IBAN non renseigné"

---

## QUAND TOUT EST VALIDÉ → PASSER EN LIVE

1. **Remplace les clés dans `.env` :**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SlQUo...
```

2. **Remplace le secret dans Supabase :**
```
STRIPE_SECRET_KEY=rk_live_51SlQUo... (ou sk_live_...)
```

3. **Crée un NOUVEAU webhook en mode LIVE :**
- URL identique
- Même événements
- Nouveau signing secret → mettre à jour `STRIPE_WEBHOOK_SECRET`

4. **Redéploie les Edge Functions**

5. **Teste avec un VRAI petit paiement** (1€) et rembourse-le immédiatement

---

## CARTES DE TEST STRIPE (Référence rapide)

| Carte | Numéro | Usage |
|-------|--------|-------|
| Visa (succès) | `4242 4242 4242 4242` | Paiement standard |
| Mastercard (succès) | `5555 5555 5555 4444` | Paiement standard |
| Visa (refusée) | `4000 0000 0000 0002` | Test échec |
| 3D Secure requis | `4000 0025 0000 3155` | Test authentification |
| Fonds insuffisants | `4000 0000 0000 9995` | Test fonds insuffisants |
| Carte expirée | `4000 0000 0000 0069` | Test carte expirée |

**Pour tous les tests :** CVC = `123`, Date = `12/34`, Code postal = `75000`
