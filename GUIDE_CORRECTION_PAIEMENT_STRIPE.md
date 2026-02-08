# Guide de Correction du Système de Paiement Stripe

## Problème Identifié

Votre paiement Stripe montre `"status": "requires_payment_method"` et `"amount_received": 0`, ce qui signifie que:

1. **Le Payment Intent a été créé** mais **le paiement n'a jamais été réellement effectué**
2. Le code actuel crée un Payment Intent puis marque immédiatement le paiement comme "completed" dans la base de données **sans réellement débiter la carte**
3. Il y a une **incohérence des statuts**: le trigger met `payment_status = 'completed'` sur `quote_requests` mais l'UI vérifie `'deposit_paid'` ou `'fully_paid'`

## Solutions Fournies

### 1. Migration SQL pour corriger les statuts (URGENT - À exécuter maintenant)

Exécutez cette migration dans l'éditeur SQL de Supabase:

```sql
-- Fichier: supabase/migrations/20260201120000_fix_payment_status_consistency.sql

-- Corriger la contrainte sur quote_requests
ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_payment_status_check;
ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_payment_status_check 
  CHECK (payment_status IN ('no_payment', 'deposit_paid', 'fully_paid', 'refunded'));

-- Recréer le trigger avec le bon statut
CREATE OR REPLACE FUNCTION update_quote_status_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    UPDATE quotes SET status = 'accepted' WHERE id = NEW.quote_id;
    UPDATE quote_requests 
    SET 
      accepted_quote_id = NEW.quote_id,
      payment_status = 'deposit_paid'  -- Maintenant correct!
    WHERE id = NEW.quote_request_id;
    UPDATE quotes 
    SET status = 'rejected' 
    WHERE quote_request_id = NEW.quote_request_id 
      AND id != NEW.quote_id 
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_update_quote_status_after_payment ON payments;
CREATE TRIGGER trigger_update_quote_status_after_payment
  AFTER INSERT OR UPDATE OF payment_status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_status_after_payment();

-- Corriger les enregistrements existants
UPDATE quote_requests SET payment_status = 'deposit_paid' WHERE payment_status = 'completed';
```

### 2. Ajouter la clé Stripe publique

Dans votre fichier `.env`, ajoutez:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique_stripe
```

Ou pour la production:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique_stripe
```

### 3. Remplacer la page de paiement

Remplacez le contenu de `src/pages/ClientPaymentPage.tsx` par celui de `src/pages/ClientPaymentPageNew.tsx` que j'ai créé.

Le nouveau fichier:
- Utilise **Stripe Elements** pour le formulaire de carte
- **Confirme réellement le paiement** avec `stripe.confirmCardPayment()`
- Ne marque le paiement comme "completed" **qu'après** confirmation de Stripe
- Met correctement à jour `payment_status = 'deposit_paid'`

### 4. Configurer le Webhook Stripe (Recommandé)

Pour une sécurité maximale, configurez un webhook Stripe:

1. Dans le Dashboard Stripe, allez dans **Developers → Webhooks**
2. Créez un endpoint pointant vers: `https://votre-projet.supabase.co/functions/v1/stripe-webhook`
3. Sélectionnez les événements:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copiez le **Webhook Signing Secret**
5. Ajoutez-le dans les variables d'environnement Supabase:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_votre_secret
   ```

### 5. Déployer la fonction webhook

```bash
supabase functions deploy stripe-webhook
```

## Test du Système

### Cartes de test Stripe

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Visa réussie | 4242 4242 4242 4242 | Paiement réussi |
| Visa refusée | 4000 0000 0000 0002 | Refusée |
| 3D Secure | 4000 0027 6000 3184 | Authentification requise |

Date d'expiration: N'importe quelle date future (ex: 12/28)
CVC: N'importe quels 3 chiffres (ex: 123)

### Vérification du flux

1. Créez un devis test
2. Cliquez sur "Accepter" → redirigé vers la page de paiement
3. Entrez une carte de test
4. Cliquez sur "Payer"
5. Vérifiez dans Stripe Dashboard que le paiement a `status: succeeded`
6. Vérifiez dans Supabase que:
   - `payments.payment_status = 'completed'`
   - `quote_requests.payment_status = 'deposit_paid'`
   - `quotes.status = 'accepted'`
7. La messagerie doit être déverrouillée

## Récapitulatif des Fichiers Créés/Modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/20260201120000_fix_payment_status_consistency.sql` | **Exécuter dans Supabase SQL** |
| `supabase/migrations/20260201120001_add_stripe_verification_columns.sql` | **Exécuter dans Supabase SQL** |
| `supabase/functions/stripe-webhook/index.ts` | **Déployer avec Supabase CLI** |
| `src/pages/ClientPaymentPageNew.tsx` | **Remplacer ClientPaymentPage.tsx** |
| `.env` | **Ajouter VITE_STRIPE_PUBLISHABLE_KEY** |

## Ordre d'exécution

1. ✅ Exécuter la migration `20260201120000_fix_payment_status_consistency.sql`
2. ✅ Exécuter la migration `20260201120001_add_stripe_verification_columns.sql`
3. ✅ Ajouter `VITE_STRIPE_PUBLISHABLE_KEY` au `.env`
4. ✅ Remplacer `ClientPaymentPage.tsx` par le nouveau code
5. ✅ (Optionnel) Déployer le webhook Stripe

## Vérification Rapide du Problème Actuel

Pour débloquer la messagerie MAINTENANT pour votre test actuel, exécutez:

```sql
-- Mettre à jour le statut de paiement pour le devis concerné
UPDATE quote_requests 
SET payment_status = 'deposit_paid' 
WHERE id = (
  SELECT quote_request_id 
  FROM payments 
  WHERE stripe_payment_id LIKE 'pi_%' 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

Cela corrigera le problème pour le paiement que vous venez d'effectuer.
