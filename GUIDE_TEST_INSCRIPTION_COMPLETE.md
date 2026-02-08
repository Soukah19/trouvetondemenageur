# Guide de Test - Inscription Complète Déménageur DROP IT

Ce guide vous permet de tester toutes les nouvelles fonctionnalités implémentées.

---

## Compte supprimé

Le compte DROP IT précédent a été complètement supprimé de la base de données.

Vous pouvez maintenant créer un nouveau compte avec les mêmes informations.

---

## Ce qui a été amélioré

### 1. Système d'emails de bienvenue
- Email automatique après inscription déménageur
- Template HTML professionnel
- Explications claires des prochaines étapes

### 2. Analyse IA des documents
- Vérification automatique de tous les documents
- Détection des documents expirés
- Détection d'anomalies
- Score de fiabilité sur 100

### 3. Fiche détaillée pour les admins
- Bouton "Voir détails" dans le dashboard admin
- Visualisation complète de toutes les informations
- Téléchargement de tous les documents
- Alertes IA visibles
- Score de vérification affiché
- Approuver/Rejeter directement depuis la fiche

---

## Étapes du test complet

### Étape 1 : Inscription déménageur

1. **Allez sur** : [Inscription Déménageur](https://votre-domaine/mover-signup)

2. **Remplissez le formulaire** avec les informations de DROP IT :
   ```
   Nom de l'entreprise : DROP IT
   SIRET : 93876378600010
   Email : dropi.transport@gmail.com (ou un autre email réel)
   Téléphone : 0759611635
   Adresse : 229 rue solferino, 59000 Lille

   Gérant :
   - Prénom : Nachi
   - Nom : Heikel
   - Téléphone : 0759611635
   ```

3. **Uploadez les documents** :
   - ✅ KBIS (avec date d'expiration)
   - ✅ Assurance RC PRO (avec date d'expiration)
   - ✅ Licence de transport (avec date d'expiration)
   - ✅ Pièce d'identité recto et verso (avec date d'expiration)
   - ✅ Carte grise du camion

4. **Ajoutez les informations** :
   - Services proposés
   - Zones de couverture
   - Informations sur les camions

5. **Cliquez sur "Créer mon compte professionnel"**

### Étape 2 : Vérifier l'email de bienvenue

1. **Vérifiez votre boîte mail** : dropi.transport@gmail.com
2. **Attendez 1-2 minutes** pour la réception
3. **Vérifiez** :
   - Email reçu avec le sujet "Bienvenue dans le réseau TrouveTonDemenageur !"
   - Template professionnel
   - Explications des prochaines étapes
   - Statut "EN ATTENTE DE VÉRIFICATION"

**Si l'email n'arrive pas** :
- Vérifiez les spams
- Vérifiez que RESEND_API_KEY est configuré dans Supabase
- Vérifiez les logs : Supabase > Edge Functions > send-welcome-email > Logs

### Étape 3 : Connexion admin et vérification IA

1. **Connectez-vous en admin** :
   - URL : [Dashboard Admin](https://votre-domaine/admin)
   - Email : admin@trouveton.fr
   - Mot de passe : Admin2026Secure!

2. **Dans la section "Déménageurs en Attente"** :
   - Vous devriez voir "DROP IT"
   - Email : dropi.transport@gmail.com
   - Date d'inscription affichée

3. **Cliquez sur "Voir détails"** :

   Un modal s'ouvre avec :

   **A. Alertes IA** (si documents expirés ou suspects) :
   - ⚠️ Documents expirés détectés
   - ⚠️ Date d'expiration proche
   - ⚠️ Anomalies détectées

   **B. Score de vérification IA** :
   - Score sur 100
   - Barre de progression colorée
   - Statut : Vérifié / Nécessite une révision / Rejeté

   **C. Informations de l'entreprise** :
   - Nom, SIRET, email, téléphone, adresse
   - Informations du gérant

   **D. Documents avec statut** :
   - KBIS : ✅ Présent + Date d'expiration + Bouton télécharger
   - Assurance : ✅ Présent + Date d'expiration + Bouton télécharger
   - Licence : ✅ Présent + Date d'expiration + Bouton télécharger
   - Identité : ✅ Présent + Recto/Verso téléchargeables

   **E. Véhicules** :
   - Liste des camions avec capacité
   - Cartes grises téléchargeables

   **F. Services et zones** :
   - Liste des services proposés
   - Zones de couverture

4. **Testez les boutons** :
   - 📥 Téléchargez chaque document
   - 👁️ Visualisez les documents
   - ✅ Bouton "Approuver"
   - ❌ Bouton "Rejeter"

### Étape 4 : Test avec document expiré

**Pour tester la détection IA** :

1. Lors de l'inscription, uploadez un document avec une date d'expiration passée
2. L'IA devrait détecter :
   - "Document expiré" en rouge
   - Score réduit
   - Alerte critique affichée pour l'admin

### Étape 5 : Approuver le déménageur

1. Après avoir vérifié tous les documents
2. Cliquez sur "Approuver"
3. Confirmez l'approbation
4. Le déménageur devrait :
   - Passer en statut "Vérifié"
   - Recevoir un email de validation
   - Pouvoir accéder aux demandes de devis

---

## Vérifications importantes

### ✅ Email de bienvenue
- [ ] Email reçu dans les 2 minutes
- [ ] Template professionnel
- [ ] Informations correctes
- [ ] Lien vers le dashboard fonctionne

### ✅ Analyse IA
- [ ] Documents analysés automatiquement
- [ ] Dates d'expiration détectées
- [ ] Score de vérification calculé
- [ ] Alertes affichées si anomalies

### ✅ Fiche déménageur admin
- [ ] Bouton "Voir détails" visible
- [ ] Modal s'ouvre correctement
- [ ] Toutes les informations affichées
- [ ] Documents téléchargeables
- [ ] Score IA visible
- [ ] Alertes IA visibles (si applicable)
- [ ] Boutons Approuver/Rejeter fonctionnent

### ✅ Système de paiement (test ultérieur)
- [ ] Création de devis
- [ ] Acceptation de devis
- [ ] Paiement avec Stripe (mode TEST)
- [ ] Commission 30% calculée
- [ ] Escrow fonctionne

---

## Logs à vérifier

### Supabase Edge Functions

**send-welcome-email** :
```
1. Supabase Dashboard
2. Edge Functions
3. send-welcome-email
4. Logs

Vérifier :
- Fonction exécutée sans erreur
- Email envoyé à Resend
- Pas d'erreur 500
```

**comprehensive-mover-verification** :
```
1. Supabase Dashboard
2. Edge Functions
3. comprehensive-mover-verification
4. Logs

Vérifier :
- Analyse IA exécutée
- Score calculé
- Alertes générées
```

### Stripe Dashboard

```
1. Stripe Dashboard
2. Payments
3. Vérifier les paiements tests
```

---

## Problèmes courants et solutions

### Email non reçu
**Cause** : RESEND_API_KEY non configuré
**Solution** :
1. Supabase > Settings > Edge Functions > Manage secrets
2. Ajoutez : RESEND_API_KEY=re_VOTRE_CLE
3. Attendez 1 minute
4. Réinscrivez un déménageur

### Analyse IA ne fonctionne pas
**Cause** : OPENAI_API_KEY ou ANTHROPIC_API_KEY non configuré
**Solution** :
1. Supabase > Settings > Edge Functions > Manage secrets
2. Ajoutez : OPENAI_API_KEY=sk-proj-VOTRE_CLE
3. Attendez 1 minute
4. Ouvrez la fiche déménageur dans le dashboard admin

### Paiement échoue
**Cause** : Clés Stripe non configurées
**Solution** :
1. Vérifiez VITE_STRIPE_PUBLISHABLE_KEY dans .env
2. Vérifiez STRIPE_SECRET_KEY dans Supabase secrets
3. Utilisez la carte test : 4242 4242 4242 4242

---

## Prochaines étapes après validation

Une fois tous les tests réussis :

1. **Configurer les clés de production** :
   - Stripe : Remplacer pk_test_ par pk_live_
   - Resend : Vérifier le domaine
   - Google Maps : Ajouter restrictions de domaine

2. **Tester en conditions réelles** :
   - Inscription avec vrais documents
   - Paiement avec vraie carte
   - Vérification email réelle

3. **Monitoring** :
   - Surveiller les logs Supabase
   - Vérifier les emails envoyés (Resend Dashboard)
   - Monitorer les paiements (Stripe Dashboard)

---

## Support

**Documentation complète** :
- DEMARRAGE_RAPIDE_PRODUCTION.md
- CONFIGURATION_CLES_API_PRODUCTION.md
- CHECKLIST_PRODUCTION.md

**Identifiants admin** :
- Email : admin@trouveton.fr
- Mot de passe : Admin2026Secure!

---

**Bonne chance pour le test !** 🚀
