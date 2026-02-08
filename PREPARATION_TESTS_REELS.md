# Préparation pour tests réels

## Nettoyage de la base de données

La base de données a été entièrement nettoyée:

- **Déménageurs**: 0
- **Clients**: 0
- **Utilisateurs restants**: 2 (admins uniquement)
- **Admins préservés**: 2
- **Devis**: 0
- **Paiements**: 0
- **Messages/Notifications**: 0

La plateforme est maintenant prête pour des tests propres avec de vraies données.

## Clés API configurées

### Configurées (fonctionnelles)

1. **Supabase** ✅
   - URL: Configurée
   - Anon Key: Configurée
   - Base de données prête

2. **Google Maps API** ✅
   - Clé: `AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg`
   - Utilisation: Autocomplétion d'adresses dans les formulaires

3. **Resend (Emails)** ✅
   - Clé: Configurée
   - Utilisation:
     * Envoi d'emails de vérification
     * Notifications par email
     * Lettre de mission après paiement

### Non configurées (nécessaires pour fonctionnalités complètes)

1. **Stripe (Paiements)** ❌
   - Clé secrète: NON configurée
   - Clé publique: NON configurée
   - Impact:
     * Les paiements fonctionnent en mode TEST avec un ID factice
     * Pour accepter de vrais paiements, il faut configurer Stripe
   - Comment obtenir:
     * Créer un compte sur https://stripe.com
     * Récupérer les clés dans https://dashboard.stripe.com/apikeys
     * Ajouter dans `.env`:
       ```
       STRIPE_SECRET_KEY=sk_test_...
       STRIPE_PUBLISHABLE_KEY=pk_test_...
       ```

2. **OpenAI (Intelligence Artificielle)** ❌
   - Clé: NON configurée
   - Impact:
     * Analyse des photos de dommages non fonctionnelle
     * Analyse des photos de meubles non fonctionnelle
     * Analyse de la lettre de mission non fonctionnelle
   - Comment obtenir:
     * Créer un compte sur https://platform.openai.com
     * Générer une clé API dans https://platform.openai.com/api-keys
     * Ajouter dans les secrets Supabase (pas dans .env):
       ```bash
       # Via le dashboard Supabase > Project Settings > Edge Functions
       OPENAI_API_KEY=sk-...
       ```

## Fonctionnalités disponibles SANS clés manquantes

### Mode TEST actuel (sans Stripe et OpenAI)

✅ **Inscription/Connexion**
- Création de compte client
- Création de compte déménageur
- Connexion admin

✅ **Demandes de devis**
- Formulaire de demande complet
- Calcul de volume
- Estimateur de prix IA

✅ **Gestion des devis**
- Déménageurs peuvent soumettre des devis
- Prix avec commission 30%
- Système de couleurs (vert/orange/rouge)

✅ **Paiements en mode TEST**
- Le client peut "payer" avec un ID de paiement factice
- Le statut du devis change correctement
- Les calculs de commission sont corrects (40% acompte, 2 versements)
- Le bouton "Accepter" disparaît après paiement

✅ **Dashboard**
- Dashboard client fonctionnel
- Dashboard déménageur fonctionnel
- Dashboard admin fonctionnel

✅ **Messagerie**
- Messages entre clients et déménageurs
- Notifications en temps réel

✅ **Système de vérification**
- Upload de documents (KBIS, assurance, identité, camions)
- Admin peut approuver/rejeter

## Fonctionnalités nécessitant les clés manquantes

### Avec Stripe configuré
- ✅ Paiements réels par carte bancaire
- ✅ Validation des cartes de crédit
- ✅ Remboursements automatiques
- ✅ Dashboard financier complet

### Avec OpenAI configuré
- ✅ Analyse automatique des photos de dommages
- ✅ Détection de responsabilité (déménageur/client)
- ✅ Analyse de la lettre de mission pour déblocage automatique
- ✅ Analyse des photos de meubles pour calcul de volume

## Tests recommandés

### Test complet du flux client (SANS clés)

1. **Inscription client**
   - Aller sur la page d'inscription client
   - Créer un compte avec un vrai email
   - Se connecter

2. **Créer une demande de devis**
   - Remplir le formulaire complet
   - Adresses de départ et d'arrivée
   - Date de déménagement
   - Services souhaités

3. **Inscription déménageur**
   - Créer un compte déménageur avec un autre email
   - Remplir le formulaire d'inscription
   - Uploader les documents (KBIS, assurance, etc.)

4. **Admin approuve le déménageur**
   - Se connecter en tant qu'admin
   - Approuver les documents du déménageur
   - Activer le compte

5. **Déménageur soumet un devis**
   - Se connecter en tant que déménageur
   - Voir la demande de devis
   - Soumettre un prix (ex: 1000€)
   - Vérifier que le prix client affiché est 1300€

6. **Client accepte et paie**
   - Se reconnecter en tant que client
   - Voir le devis reçu
   - Cliquer sur "Accepter"
   - "Payer" en mode test
   - Vérifier le message de confirmation

7. **Vérifications**
   - Le déménageur voit le devis comme "accepté"
   - Le bouton "Accepter" a disparu côté client
   - Le paiement apparaît dans la base avec les bons montants:
     * total_amount: 1300
     * amount_paid: 520 (40%)
     * platform_fee: 300 (30% de 1000)
     * mover_deposit: 110 (1er versement)
     * escrow_amount: 110 (2e versement)
     * remaining_amount: 780 (60%)

### Test complet avec TOUTES les clés

Si Stripe et OpenAI sont configurés, tester en plus:

8. **Paiement réel Stripe**
   - Utiliser une carte de test Stripe: `4242 4242 4242 4242`
   - Vérifier la transaction dans le dashboard Stripe

9. **Système de fin de mission**
   - Upload une lettre de mission après le déménagement
   - L'IA analyse automatiquement
   - Admin approuve le déblocage
   - Vérifier que le 2e versement est marqué comme débloqué

10. **Analyse de dommages**
    - Uploader des photos avant/après
    - L'IA détecte les dommages
    - L'IA suggère la responsabilité

## Script de nettoyage

Pour refaire un nettoyage complet de la base, utiliser:

```bash
# Le script est dans cleanup_complete_database.sql
# Il préserve uniquement les comptes admin
```

Ou via l'interface Supabase:
1. Aller dans SQL Editor
2. Copier/coller le contenu de `cleanup_complete_database.sql`
3. Exécuter

## Comptes admin existants

2 comptes admin sont préservés dans la base. Pour voir leurs emails:

```sql
SELECT email, role FROM admins;
```

## Prochaines étapes recommandées

1. **Configurer Stripe** (priorité haute pour les paiements réels)
   - Créer un compte Stripe
   - Ajouter les clés dans `.env`
   - Tester avec une carte de test

2. **Configurer OpenAI** (priorité moyenne pour l'IA)
   - Créer un compte OpenAI
   - Générer une clé API
   - L'ajouter dans les secrets Supabase Edge Functions

3. **Tests avec vrais emails**
   - Créer plusieurs comptes avec de vrais emails
   - Vérifier la réception des emails (vérification, notifications, lettre de mission)

4. **Tests de bout en bout**
   - Suivre le scénario complet ci-dessus
   - Documenter tout problème rencontré
   - Vérifier que tous les calculs sont corrects

## Notes importantes

- Les emails sont envoyés via Resend (configuré)
- La vérification d'email est désactivée (`VITE_ENABLE_EMAIL_VERIFICATION=false`)
- Les paiements en mode TEST créent un ID factice mais suivent le bon flux
- Tous les calculs de commission sont corrects même en mode TEST
