# 🧪 Guide de Test - Workflow Complet

## Prérequis

### 1. Exécuter la Migration SQL
```sql
-- Exécuter dans Supabase SQL Editor:
-- Le fichier: 20260202100000_add_rib_and_contracts_system.sql
```

### 2. Vérifier les Edge Functions Déployées

Les fonctions suivantes doivent être déployées:
```bash
# Lister les fonctions déployées
supabase functions list

# Déployer si nécessaire
supabase functions deploy create-payment-intent
supabase functions deploy analyze-mission-letter
supabase functions deploy analyze-damage-photo
```

### 3. Variables d'Environnement (Supabase Secrets)
```bash
# Pour Stripe (mode test)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Pour OpenAI (optionnel - pour analyse IA)
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## 🔄 Test du Workflow Complet

### ÉTAPE 1: Créer un Client Test

1. Aller sur `/client/signup`
2. Créer un compte client
3. Vérifier l'email (ou désactiver la vérification en dev)

### ÉTAPE 2: Créer un Déménageur Test

1. Aller sur `/mover/signup`
2. Remplir toutes les infos y compris le **RIB**:
   - IBAN: `FR7630001007941234567890185` (test)
   - BIC: `BDFEFRPP`
   - Banque: `Banque de France`
   - Titulaire: Nom de l'entreprise
3. Compléter l'inscription
4. **Admin doit vérifier le déménageur** dans `/admin/dashboard` → Utilisateurs

### ÉTAPE 3: Client Crée une Demande de Devis

1. Se connecter en tant que client
2. Aller sur `/client/quote`
3. Remplir le formulaire:
   - Adresses départ/arrivée
   - Date de déménagement
   - **📸 ÉTAPE 1: Uploader des photos AVANT** (optionnel mais recommandé pour tester l'IA)
4. Soumettre la demande

### ÉTAPE 4: Déménageur Envoie un Devis

1. Se connecter en tant que déménageur vérifié
2. Aller sur `/mover/quote-requests`
3. Trouver la demande du client
4. Proposer un prix et envoyer le devis

### ÉTAPE 5: Client Accepte et Paie

1. Se reconnecter en tant que client
2. Aller sur `/client/dashboard`
3. Voir le devis reçu
4. Cliquer "Accepter"
5. Page de paiement:
   - **Mode Test**: Utiliser une fausse carte
   - Numéro: `4242 4242 4242 4242`
   - Date: n'importe quelle date future
   - CVV: `123`
6. Confirmer le paiement

### VÉRIFICATION APRÈS PAIEMENT:

✅ **Client**:
- Messagerie débloquée
- Peut voir les coordonnées du déménageur
- Contrat disponible dans `/client/contracts`

✅ **Déménageur**:
- Reçoit notification
- Peut voir les coordonnées du client
- Contrat disponible dans `/mover/contracts`

✅ **Admin**:
- Voit le contrat dans Admin → Contrats
- Peut envoyer les emails si pas auto

### ÉTAPE 6: Jour du Déménagement (Simulation)

**Déménageur - Photos au chargement:**
1. Aller sur `/mover/damage-photos`
2. Sélectionner la mission
3. **📸 ÉTAPE 2: Uploader des photos au CHARGEMENT**

**Client - Photos au déchargement:**
1. Aller sur `/client/moving/{quoteRequestId}/tracking`
2. **📸 ÉTAPE 3: Uploader des photos au DÉCHARGEMENT**
3. Si dommage constaté → Signaler via le formulaire

### ÉTAPE 7: Fin de Mission

1. Se connecter en tant que déménageur
2. Aller sur `/mover/my-quotes`
3. Trouver la mission
4. Cliquer **"Déclarer fin de mission"**

**Ce qui se passe:**
- Si photos AVANT + APRÈS existent → IA compare et génère rapport
- Demande envoyée à l'admin pour validation

### ÉTAPE 8: Admin Valide

1. Se connecter en tant qu'admin
2. Aller sur Admin → **Déblocages**
3. Voir la demande avec rapport IA (si disponible)
4. Cliquer **"Approuver"**

**Résultat:**
- Statut du paiement → `released_to_mover`
- Le déménageur recevrait son paiement (simulation)

---

## 🐛 Dépannage

### Problème: "Erreur lors de la création du paiement"

**Cause**: La fonction `create-payment-intent` n'est pas déployée ou `STRIPE_SECRET_KEY` manquant.

**Solution Dev**: Modifier le code pour simuler le paiement sans Stripe:

```typescript
// Dans ClientPaymentPage.tsx, remplacer l'appel Stripe par:
const paymentIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

### Problème: Messagerie reste bloquée après paiement

**Cause**: Le trigger met `payment_status = 'completed'` au lieu de `'deposit_paid'`.

**Solution**: Exécuter le fix SQL:
```sql
UPDATE quote_requests 
SET payment_status = 'deposit_paid' 
WHERE payment_status = 'completed';
```

### Problème: Le bouton "Fin de mission" ne s'affiche pas

**Cause**: Pas de paiement trouvé pour le devis.

**Vérifier**:
```sql
SELECT * FROM payments WHERE quote_id = 'votre-quote-id';
```

### Problème: L'analyse IA échoue

**Cause**: `OPENAI_API_KEY` non configurée ou fonction non déployée.

**Solution**: L'app fonctionne sans IA - elle utilise une analyse basique par mots-clés.

---

## 📋 Checklist de Test

### Phase 1: Configuration
- [ ] Migration SQL exécutée
- [ ] Edge functions déployées (ou mode test activé)
- [ ] Compte admin créé

### Phase 2: Inscription
- [ ] Client peut s'inscrire
- [ ] Déménageur peut s'inscrire avec RIB
- [ ] Admin peut vérifier le déménageur

### Phase 3: Devis
- [ ] Client crée demande avec photos AVANT
- [ ] Déménageur voit la demande
- [ ] Déménageur envoie un devis
- [ ] Client voit le devis

### Phase 4: Paiement
- [ ] Client peut payer (test)
- [ ] Contrat créé automatiquement
- [ ] Messagerie débloquée
- [ ] Coordonnées visibles

### Phase 5: Déménagement
- [ ] Déménageur upload photos CHARGEMENT
- [ ] Client upload photos DÉCHARGEMENT
- [ ] Client peut signaler dommage

### Phase 6: Fin de Mission
- [ ] Déménageur déclare fin de mission
- [ ] Admin voit la demande de déblocage
- [ ] Admin peut approuver/rejeter

### Phase 7: Contrats
- [ ] Client voit son contrat dans `/client/contracts`
- [ ] Déménageur voit son contrat dans `/mover/contracts`
- [ ] Admin voit tous les contrats

---

## 🔧 Mode Dev Sans Stripe

Si vous voulez tester **sans Stripe**, voici un quick fix:

Dans `src/pages/ClientPaymentPage.tsx`, trouvez la fonction `handlePayment` et remplacez l'appel Stripe par:

```typescript
// DÉBUT MODE TEST - Supprimer en production
const paymentIntentId = `pi_test_${Date.now()}`;
console.log('🧪 MODE TEST: Paiement simulé', paymentIntentId);
// FIN MODE TEST
```

Cela créera un faux ID de paiement et permettra de tester tout le workflow sans avoir besoin de Stripe.
