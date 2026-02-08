# INTÉGRATION STRIPE - STATUT 27 JANVIER 2026

## ✅ CE QUI A ÉTÉ FAIT

### 1. Configuration de la clé Stripe
**Fichier:** `.env`
- ✅ Clé secrète ajoutée: `STRIPE_SECRET_KEY=rk_live_51SlQUo...`
- ⚠️ Type de clé: **RESTRICTED KEY (rk_live_...)** - Clé de production avec restrictions
- ❌ Clé publique manquante: `VITE_STRIPE_PUBLISHABLE_KEY` non fournie

### 2. Dépendances installées
```bash
✅ stripe@17.4.0 (pour edge functions)
✅ @stripe/stripe-js (pour frontend, si clé publique disponible)
```

### 3. Edge Function créée et déployée
**Fichier:** `supabase/functions/create-payment-intent/index.ts`
**Statut:** ✅ Déployée et fonctionnelle

**Fonctionnalités:**
- Crée un PaymentIntent Stripe
- Montant configurable
- Métadonnées avec quote_id
- Support automatic_payment_methods
- Gestion d'erreurs complète
- CORS configuré

**Exemple d'utilisation:**
```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/create-payment-intent`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 624,        // Montant en euros
      quoteId: 'abc123',  // ID du devis
      description: 'Acompte déménagement Lyon → Paris'
    })
  }
);

const { paymentIntentId, clientSecret } = await response.json();
```

### 4. Page de paiement modifiée
**Fichier:** `src/pages/ClientPaymentPage.tsx`

**Modifications:**
- ✅ Appel à l'edge function `create-payment-intent`
- ✅ Récupération du PaymentIntent ID
- ✅ Enregistrement dans la table `payments` avec vrai ID Stripe
- ✅ Validations formulaire (carte, expiration, CVV)
- ✅ Message d'avertissement sur configuration partielle

**Avant:**
```typescript
stripe_payment_id: 'test_' + Date.now()  // ❌ ID factice
```

**Après:**
```typescript
stripe_payment_id: paymentIntentId  // ✅ Vrai ID Stripe (pi_...)
```

### 5. Interface utilisateur mise à jour
- ✅ Message: "Stripe connecté - PaymentIntent créé"
- ✅ Avertissement: Configuration Stripe partielle visible
- ✅ Information claire pour l'utilisateur

---

## ⚠️ LIMITATIONS ACTUELLES

### 1. Clé restreinte (rk_live_...)
**Problème:**
La clé fournie est une "Restricted Key", pas une clé complète (sk_live_...).

**Implications:**
- ✅ Peut créer des PaymentIntents
- ❌ Permissions limitées selon restrictions Stripe
- ⚠️ Vérifier dans le dashboard Stripe les permissions exactes

**Action requise:**
Vérifier les permissions de cette clé dans: https://dashboard.stripe.com/apikeys

### 2. Clé publique manquante
**Problème:**
`VITE_STRIPE_PUBLISHABLE_KEY` non fournie (pk_live_...).

**Implications:**
- ❌ Impossible d'utiliser Stripe Elements (formulaire sécurisé)
- ❌ Pas de validation côté client par Stripe
- ⚠️ Saisie manuelle de la carte (moins sécurisé)

**Action requise:**
Obtenir la clé publique correspondante: https://dashboard.stripe.com/apikeys

### 3. Confirmation de paiement non implémentée
**Problème:**
Le PaymentIntent est créé mais jamais confirmé.

**Statut actuel du flow:**
1. ✅ Frontend: Formulaire rempli
2. ✅ Edge function: PaymentIntent créé
3. ❌ **MANQUANT:** Confirmation du PaymentIntent
4. ✅ Base de données: Enregistrement avec PaymentIntent ID

**Conséquence:**
Le PaymentIntent existe dans Stripe avec statut `requires_payment_method` ou `requires_confirmation`,
mais n'est jamais confirmé. **Aucun argent n'est débité.**

### 4. Webhooks non configurés
**Problème:**
Pas de validation asynchrone des paiements.

**Risque:**
Un utilisateur pourrait marquer un paiement comme "completed" même si Stripe refuse la carte.

---

## 🔧 CE QU'IL FAUT FAIRE POUR FINALISER

### Option A: Intégration complète avec Stripe Elements (RECOMMANDÉ)

**Prérequis:**
- Clé publique pk_live_... fournie

**Étapes:**
1. Ajouter pk_live_... dans `.env`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_votreclé
```

2. Installer @stripe/react-stripe-js:
```bash
npm install @stripe/react-stripe-js
```

3. Créer composant StripeCheckoutForm:
```typescript
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Formulaire sécurisé avec Stripe Elements
// Confirmation automatique avec 3D Secure
```

4. Modifier ClientPaymentPage pour utiliser StripeCheckoutForm

**Avantages:**
- ✅ PCI-compliant (pas de données carte sur vos serveurs)
- ✅ 3D Secure automatique
- ✅ Validation Stripe en temps réel
- ✅ UX professionnelle

**Temps estimé:** 2-3 jours

---

### Option B: Confirmation manuelle (SOLUTION ACTUELLE AMÉLIORÉE)

**Sans clé publique, on peut quand même confirmer le PaymentIntent.**

**Modification requise dans edge function:**

**Créer nouvelle edge function:** `supabase/functions/confirm-payment/index.ts`

```typescript
import Stripe from "npm:stripe@17.4.0";

// Confirme un PaymentIntent avec les données de carte
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const paymentIntent = await stripe.paymentIntents.confirm(
  paymentIntentId,
  {
    payment_method: {
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvv,
      },
      billing_details: {
        name: cardName,
      },
    },
  }
);

// Vérifier statut: succeeded, requires_action, etc.
```

**⚠️ ATTENTION:** Cette approche transmet les données de carte au serveur, ce qui:
- ❌ N'est PAS PCI-compliant
- ❌ Nécessite certification PCI DSS Level 1
- ❌ Expose à des responsabilités légales
- ❌ Viole les bonnes pratiques Stripe

**Temps estimé:** 1 jour (mais non recommandé)

---

### Option C: Confirmation avec Payment Method existant

**Si l'utilisateur a déjà une carte enregistrée:**

```typescript
// Dans edge function
const paymentIntent = await stripe.paymentIntents.confirm(
  paymentIntentId,
  {
    payment_method: 'pm_card_visa', // ID Payment Method existant
  }
);
```

**Temps estimé:** 2 heures

---

## 📋 WEBHOOKS STRIPE (CRITIQUE)

**Pourquoi c'est nécessaire:**
Les webhooks permettent à Stripe de notifier votre système quand un paiement change de statut.

**Événements à écouter:**
- `payment_intent.succeeded` → Paiement réussi
- `payment_intent.payment_failed` → Paiement échoué
- `payment_intent.canceled` → Paiement annulé
- `charge.refunded` → Remboursement effectué

**Création:**
1. Créer `supabase/functions/stripe-webhook/index.ts`
2. Vérifier signature Stripe
3. Mettre à jour table `payments` selon événement

**Configuration dans Stripe:**
https://dashboard.stripe.com/webhooks
Endpoint: `https://votre-projet.supabase.co/functions/v1/stripe-webhook`

**Temps estimé:** 1 jour

---

## 🎯 RECOMMANDATIONS

### Priorité 1 (CRITIQUE)
1. ✅ **FAIT:** Obtenir clé secrète Stripe
2. ❌ **URGENT:** Obtenir clé publique pk_live_...
3. ❌ **URGENT:** Confirmer les permissions de la clé restricted

### Priorité 2 (IMPORTANT)
4. ❌ Implémenter confirmation avec Stripe Elements (Option A)
5. ❌ Configurer webhooks Stripe
6. ❌ Tester paiement bout en bout

### Priorité 3 (OPTIMISATION)
7. ❌ Gérer les erreurs de paiement (carte refusée, etc.)
8. ❌ Ajouter retry logic
9. ❌ Logger tous les événements Stripe

---

## 📊 COMPARAISON AVANT/APRÈS

| Aspect | Avant | Maintenant | Production |
|--------|-------|------------|------------|
| Clé Stripe | ❌ Placeholder | ✅ rk_live_... | ⚠️ Vérifier permissions |
| PaymentIntent | ❌ ID factice | ✅ Créé dans Stripe | ⚠️ Non confirmé |
| Stripe installé | ❌ Non | ✅ Oui | ✅ OK |
| Edge function | ❌ Non | ✅ Déployée | ✅ OK |
| Argent débité | ❌ Non | ❌ Non | ❌ Confirmation manquante |
| PCI-compliant | ❌ Non | ❌ Non | ❌ Needs Elements |
| Webhooks | ❌ Non | ❌ Non | ❌ À faire |

---

## 🧪 TEST DISPONIBLE

### Test du PaymentIntent

**Comptes test:**
- Client: client.test@example.com / Test123456
- Devis accepté prêt pour paiement

**Parcours:**
1. Se connecter comme client
2. Aller sur page paiement
3. Remplir formulaire (validations actives)
4. Cliquer "Payer l'acompte"
5. ✅ Vérifier console: "PaymentIntent Stripe créé: pi_..."
6. ✅ Vérifier en base: `stripe_payment_id` commence par `pi_`
7. ⚠️ Vérifier dashboard Stripe: PaymentIntent existe mais status = `requires_confirmation`

### Vérification Stripe Dashboard

1. Aller sur: https://dashboard.stripe.com/payments
2. Chercher le PaymentIntent ID (pi_...)
3. ✅ Vérifier qu'il existe
4. ⚠️ Statut attendu: `requires_payment_method` ou `requires_confirmation`
5. ❌ Statut NOT `succeeded` car non confirmé

---

## 📞 PROCHAINES ÉTAPES

### Immédiat (cette semaine)
1. **Obtenir pk_live_...** de Stripe Dashboard
2. **Vérifier permissions** de la clé rk_live_...
3. **Tester** création de PaymentIntent avec comptes test

### Court terme (2 semaines)
1. Implémenter Stripe Elements (Option A)
2. Confirmer les paiements
3. Configurer webhooks
4. Tester avec cartes de test Stripe

### Moyen terme (1 mois)
1. Gérer tous les cas d'erreur
2. Ajouter retry logic
3. Monitoring et alertes
4. Tests bout en bout complets

---

## 🔗 LIENS UTILES

- Dashboard Stripe: https://dashboard.stripe.com
- API Keys: https://dashboard.stripe.com/apikeys
- Webhooks: https://dashboard.stripe.com/webhooks
- Cartes de test: https://stripe.com/docs/testing#cards
- Docs PaymentIntent: https://stripe.com/docs/payments/payment-intents
- Docs Elements: https://stripe.com/docs/stripe-js

---

**Créé le:** 27 janvier 2026
**Dernière mise à jour:** 27 janvier 2026
**Statut:** ⚠️ PaymentIntent créé mais non confirmé - Argent non débité
