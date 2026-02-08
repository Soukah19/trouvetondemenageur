# Checklist de Configuration Production

Utilisez cette checklist pour vous assurer que tout est correctement configuré avant le lancement en production.

---

## Phase 1 : Configuration des Services Externes

### Resend (Emails)
- [ ] Compte Resend créé : [https://resend.com/signup](https://resend.com/signup)
- [ ] Clé API obtenue (commence par `re_`)
- [ ] Domaine ajouté et vérifié (pour production)
- [ ] Enregistrements DNS configurés (SPF, DKIM, MX)
- [ ] Test d'envoi d'email réussi

**Instructions** : Voir `DEMARRAGE_RAPIDE_PRODUCTION.md` - Étape 1

---

### Stripe (Paiements)

#### Mode TEST (Pour développement et tests)
- [ ] Compte Stripe créé : [https://stripe.com](https://stripe.com)
- [ ] Clés TEST obtenues :
  - [ ] Publishable Key (`pk_test_...`)
  - [ ] Secret Key (`sk_test_...`)
- [ ] Test de paiement réussi avec carte `4242 4242 4242 4242`

#### Mode LIVE (Pour production)
- [ ] Profil d'entreprise complété
- [ ] Informations bancaires ajoutées
- [ ] Compte Stripe activé (validation obtenue)
- [ ] Clés LIVE obtenues :
  - [ ] Publishable Key (`pk_live_...`)
  - [ ] Secret Key (`sk_live_...`)
- [ ] Webhook configuré
- [ ] Test de paiement réel effectué

**Instructions** : Voir `DEMARRAGE_RAPIDE_PRODUCTION.md` - Étape 2

---

### Google Maps (Autocomplétion)
- [ ] Projet Google Cloud créé
- [ ] APIs activées :
  - [ ] Places API
  - [ ] Maps JavaScript API
  - [ ] Geocoding API
- [ ] Clé API créée
- [ ] Restrictions configurées :
  - [ ] HTTP referrers ajoutés
  - [ ] APIs restreintes
- [ ] Facturation activée
- [ ] Test d'autocomplétion réussi

**Instructions** : Voir `DEMARRAGE_RAPIDE_PRODUCTION.md` - Étape 3

**Coût estimé** : 20€/mois pour 1000 requêtes/jour

---

### IA - Analyse de Documents

#### Option A : OpenAI (Recommandé)
- [ ] Compte OpenAI créé : [https://platform.openai.com](https://platform.openai.com)
- [ ] Moyen de paiement ajouté
- [ ] Clé API obtenue (commence par `sk-proj-`)
- [ ] Test d'analyse IA réussi

**Coût estimé** : 30-50€/mois pour 100 analyses/jour

#### Option B : Anthropic (Alternative)
- [ ] Compte Anthropic créé : [https://console.anthropic.com](https://console.anthropic.com)
- [ ] Clé API obtenue (commence par `sk-ant-`)
- [ ] Test d'analyse IA réussi

**Instructions** : Voir `DEMARRAGE_RAPIDE_PRODUCTION.md` - Étape 4

---

## Phase 2 : Configuration Frontend (.env)

### Fichier .env créé et configuré
```bash
# À la racine du projet
cp .env.example .env
```

- [ ] `VITE_SUPABASE_URL` : URL de votre projet Supabase
- [ ] `VITE_SUPABASE_ANON_KEY` : Clé publique Supabase
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` : Clé publique Stripe (pk_test_ ou pk_live_)
- [ ] `VITE_GOOGLE_MAPS_API_KEY` : Clé Google Maps API
- [ ] `VITE_ENABLE_EMAIL_VERIFICATION` : false (ou true si souhaité)

### Vérification
```bash
# Vérifier que le fichier .env existe
cat .env

# Le fichier .env ne doit PAS être commité
# Vérifier qu'il est dans .gitignore
cat .gitignore | grep .env
```

---

## Phase 3 : Configuration Backend (Supabase Secrets)

### Accès aux Secrets Supabase
1. Supabase Dashboard : [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Settings > Edge Functions
3. Manage secrets

### Secrets à configurer
- [ ] `RESEND_API_KEY` : Clé API Resend (re_...)
- [ ] `STRIPE_SECRET_KEY` : Clé secrète Stripe (sk_test_... ou sk_live_...)
- [ ] `OPENAI_API_KEY` : Clé OpenAI (sk-proj-...) **OU**
- [ ] `ANTHROPIC_API_KEY` : Clé Anthropic (sk-ant-...)

### Vérification
- [ ] Tous les secrets sont présents dans Supabase
- [ ] Aucun secret n'est exposé dans le code frontend
- [ ] Les secrets sont correctement référencés dans les Edge Functions

---

## Phase 4 : Tests Complets

### Test 1 : Inscription Déménageur
1. [ ] Créer un compte déménageur de test
2. [ ] Uploader tous les documents requis
3. [ ] Vérifier la réception de l'email de bienvenue
4. [ ] Vérifier dans le dashboard admin :
   - [ ] Le déménageur apparaît dans "En attente"
   - [ ] Le bouton "Voir détails" fonctionne
   - [ ] L'analyse IA affiche un score
   - [ ] Les alertes IA sont visibles (si documents expirés)
   - [ ] Tous les documents sont téléchargeables

### Test 2 : Paiement Stripe

#### En mode TEST
1. [ ] Créer un devis client
2. [ ] Envoyer un devis déménageur
3. [ ] Accepter le devis côté client
4. [ ] Effectuer un paiement avec la carte test : `4242 4242 4242 4242`
5. [ ] Vérifier que le paiement apparaît dans :
   - [ ] Dashboard client
   - [ ] Dashboard déménageur
   - [ ] Dashboard admin
   - [ ] Stripe Dashboard

#### En mode LIVE (Production)
1. [ ] Effectuer un paiement test avec une vraie carte
2. [ ] Vérifier la commission de 30%
3. [ ] Vérifier le système d'escrow
4. [ ] Tester le déblocage après fin de mission

### Test 3 : Autocomplétion d'adresses
1. [ ] Ouvrir la page de création de devis
2. [ ] Taper une adresse dans le champ "Adresse de départ"
3. [ ] Vérifier que les suggestions apparaissent
4. [ ] Sélectionner une adresse
5. [ ] Vérifier que l'adresse complète est renseignée

### Test 4 : Système de notifications
1. [ ] Vérifier les emails de bienvenue
2. [ ] Vérifier les notifications in-app
3. [ ] Vérifier les emails de devis
4. [ ] Vérifier les emails de paiement

### Test 5 : Dashboard Admin
1. [ ] Connexion admin : admin@trouveton.fr / Admin2026Secure!
2. [ ] Vérifier toutes les statistiques
3. [ ] Approuver/Rejeter un déménageur
4. [ ] Gérer les paiements en escrow
5. [ ] Voir les logs et activités

---

## Phase 5 : Sécurité

### Vérifications de sécurité
- [ ] Fichier `.env` dans `.gitignore`
- [ ] Aucune clé secrète dans le code source
- [ ] RLS activée sur toutes les tables Supabase
- [ ] Clés API Google Maps restreintes par domaine
- [ ] Clés Stripe en mode TEST pour les tests
- [ ] HTTPS activé sur le domaine de production
- [ ] Politique de confidentialité ajoutée
- [ ] CGU/CGV ajoutées
- [ ] Cookies : Bannière de consentement RGPD

---

## Phase 6 : Performance et Monitoring

### Configuration du monitoring
- [ ] Supabase logs activés
- [ ] Stripe webhooks configurés
- [ ] Google Analytics ou alternative installé (optionnel)
- [ ] Sentry ou système de tracking d'erreurs (optionnel)

### Optimisation
- [ ] Build de production testé : `npm run build`
- [ ] Images optimisées
- [ ] Cache configuré
- [ ] CDN configuré (optionnel)

---

## Phase 7 : Passage en Production

### Avant le lancement
- [ ] Backup complet de la base de données
- [ ] Tests complets en mode TEST réussis
- [ ] Remplacer toutes les clés TEST par les clés LIVE :
  - [ ] Stripe : pk_test_ → pk_live_ et sk_test_ → sk_live_
  - [ ] Resend : Domaine de production configuré
- [ ] Déploiement sur serveur de production
- [ ] DNS configuré correctement
- [ ] SSL/HTTPS actif
- [ ] Monitoring en place

### Jour du lancement
- [ ] Vérifier que tous les services sont opérationnels
- [ ] Effectuer un test complet end-to-end
- [ ] Monitorer les logs pendant les premières heures
- [ ] Être disponible pour résoudre les problèmes rapidement

---

## Budget Mensuel Estimé (Production)

| Service | Coût |
|---------|------|
| Supabase Pro | 25€ |
| Resend | 0-20€ |
| Stripe | 1.4% + 0.25€/transaction |
| Google Maps | ~20€ |
| OpenAI API | ~30-50€ |
| **TOTAL** | **75-115€/mois** |

Plus les commissions Stripe sur les transactions.

---

## Support et Documentation

### Documents de référence
- 📄 `DEMARRAGE_RAPIDE_PRODUCTION.md` : Guide étape par étape
- 📄 `CONFIGURATION_CLES_API_PRODUCTION.md` : Documentation complète
- 📄 `.env.example` : Template de configuration

### Logs et débogage
- **Supabase** : Dashboard > Edge Functions > Logs
- **Stripe** : Dashboard > Developers > Logs
- **Google Cloud** : Console > Logs Explorer
- **Resend** : Dashboard > Logs

### En cas de problème
1. Vérifier les logs du service concerné
2. Vérifier que toutes les clés sont correctement configurées
3. Vérifier les quotas et limites des services
4. Consulter la documentation du service
5. Contacter le support du service si nécessaire

---

## Maintenance Continue

### Hebdomadaire
- [ ] Vérifier les logs d'erreurs
- [ ] Vérifier les coûts des services
- [ ] Monitorer les performances

### Mensuel
- [ ] Vérifier les dates d'expiration des documents déménageurs
- [ ] Vérifier les paiements en escrow
- [ ] Analyser les métriques de conversion
- [ ] Optimiser les coûts si nécessaire

### Annuel
- [ ] Renouveler les certificats SSL si nécessaire
- [ ] Mettre à jour les dépendances
- [ ] Réviser les politiques de sécurité
- [ ] Revoir les contrats avec les fournisseurs

---

**Date de création** : Janvier 2026
**Dernière révision** : Janvier 2026

---

## Statut de Configuration

Utilisez cette section pour suivre votre progression :

```
[  ] Phase 1 : Services externes (0/4)
[  ] Phase 2 : Configuration frontend (0/5)
[  ] Phase 3 : Configuration backend (0/3)
[  ] Phase 4 : Tests complets (0/5)
[  ] Phase 5 : Sécurité (0/9)
[  ] Phase 6 : Performance (0/4)
[  ] Phase 7 : Production (0/8)

TOTAL : 0/38 étapes complétées
```

Une fois toutes les étapes complétées, votre plateforme est prête pour la production ! 🚀
