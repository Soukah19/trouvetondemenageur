# 🗺️ GUIDE COMPLET - CRÉER UNE CLÉ API GOOGLE MAPS

## RÉSUMÉ RAPIDE

Temps estimé : **10 minutes**
Coût : **Gratuit** (avec limites généreuses)
Prérequis : Un compte Google

---

## ÉTAPE 1 : ACCÉDER À GOOGLE CLOUD CONSOLE

### 1.1 Connexion

1. Rendez-vous sur : **https://console.cloud.google.com**
2. Connectez-vous avec votre compte Google
3. Acceptez les conditions d'utilisation si demandé

### 1.2 Créer ou sélectionner un projet

**Option A : Créer un nouveau projet (RECOMMANDÉ)**

1. En haut de la page, cliquez sur le sélecteur de projet (à côté de "Google Cloud")
2. Cliquez sur **"NOUVEAU PROJET"**
3. Remplissez les informations :
   - **Nom du projet** : `TrouveTonDemenageur-Maps`
   - **Organisation** : Laissez par défaut (Aucune organisation)
   - **Emplacement** : Laissez par défaut
4. Cliquez sur **"CRÉER"**
5. Attendez 10-20 secondes que le projet soit créé
6. Assurez-vous que ce nouveau projet est sélectionné (visible en haut de la page)

**Option B : Utiliser un projet existant**

1. Cliquez sur le sélecteur de projet en haut
2. Sélectionnez votre projet existant dans la liste

---

## ÉTAPE 2 : ACTIVER LA FACTURATION (OBLIGATOIRE)

Google Maps nécessite un compte de facturation même pour l'usage gratuit.

### 2.1 Configuration du compte de facturation

1. Dans le menu de gauche (☰), allez dans **"Facturation"** (Billing)
2. Si vous n'avez pas de compte de facturation :
   - Cliquez sur **"CRÉER UN COMPTE DE FACTURATION"**
   - Remplissez les informations :
     - Type de compte : **Individuel** ou **Entreprise**
     - Pays : **France** (ou votre pays)
     - Devise : **EUR**
   - **Entrez vos informations de carte bancaire**
     - Aucun débit ne sera effectué automatiquement
     - Vous devez activer manuellement la facturation automatique
     - Crédit gratuit de $200 pour 90 jours (nouveaux comptes)
3. Cliquez sur **"VALIDER ET ACTIVER LA FACTURATION"**

### 2.2 Associer le compte de facturation au projet

1. Dans Facturation, cliquez sur **"Mes projets"**
2. Trouvez votre projet `TrouveTonDemenageur-Maps`
3. Cliquez sur les **3 points** (⋮) → **"Modifier la facturation"**
4. Sélectionnez votre compte de facturation
5. Cliquez sur **"DÉFINIR LE COMPTE"**

---

## ÉTAPE 3 : ACTIVER LES APIs NÉCESSAIRES

Vous devez activer 4 APIs pour que l'autocomplétion fonctionne.

### 3.1 Accéder à la bibliothèque d'APIs

1. Dans le menu (☰), allez dans **"APIs et services"** → **"Bibliothèque"**
2. Ou accédez directement : **https://console.cloud.google.com/apis/library**

### 3.2 Activer Maps JavaScript API

1. Dans la barre de recherche, tapez : `Maps JavaScript API`
2. Cliquez sur **"Maps JavaScript API"**
3. Cliquez sur le bouton bleu **"ACTIVER"**
4. Attendez 5-10 secondes (l'API sera activée)

### 3.3 Activer Places API (CRITIQUE)

1. Retournez à la bibliothèque (flèche retour ou lien "Bibliothèque")
2. Tapez : `Places API`
3. Cliquez sur **"Places API"**
4. Cliquez sur **"ACTIVER"**

### 3.4 Activer Geocoding API

1. Retournez à la bibliothèque
2. Tapez : `Geocoding API`
3. Cliquez sur **"Geocoding API"**
4. Cliquez sur **"ACTIVER"**

### 3.5 Activer Distance Matrix API (optionnel mais recommandé)

1. Retournez à la bibliothèque
2. Tapez : `Distance Matrix API`
3. Cliquez sur **"Distance Matrix API"**
4. Cliquez sur **"ACTIVER"**

**Résumé des APIs activées :**
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API
- ✅ Distance Matrix API

---

## ÉTAPE 4 : CRÉER LA CLÉ API

### 4.1 Accéder aux identifiants

1. Dans le menu (☰), allez dans **"APIs et services"** → **"Identifiants"**
2. Ou accédez directement : **https://console.cloud.google.com/apis/credentials**

### 4.2 Créer une nouvelle clé

1. En haut de la page, cliquez sur **"+ CRÉER DES IDENTIFIANTS"**
2. Sélectionnez **"Clé API"** dans le menu déroulant
3. Une fenêtre s'ouvre avec votre nouvelle clé

**IMPORTANT** : Une clé API ressemble à ceci :
```
AIzaSyAbCdEf123456789GhIjKlMnOpQrStUvWxYz
```

4. **COPIEZ IMMÉDIATEMENT CETTE CLÉ** et sauvegardez-la dans un endroit sûr
5. NE FERMEZ PAS la fenêtre pour l'instant

---

## ÉTAPE 5 : CONFIGURER LES RESTRICTIONS (SÉCURITÉ)

### 5.1 Restreindre par référent HTTP (RECOMMANDÉ pour développement)

Dans la fenêtre de création de clé :

1. Cliquez sur **"RESTREINDRE LA CLÉ"**
2. Dans "Restrictions d'application", sélectionnez **"Référents HTTP (sites web)"**
3. Cliquez sur **"AJOUTER UN ÉLÉMENT"** et ajoutez ces référents :

   ```
   localhost/*
   ```

   Cliquez sur **"AJOUTER UN ÉLÉMENT"** à nouveau et ajoutez :

   ```
   127.0.0.1/*
   ```

   Cliquez sur **"AJOUTER UN ÉLÉMENT"** à nouveau et ajoutez :

   ```
   *.bolt.new/*
   ```

   Si vous avez un domaine de production, ajoutez-le aussi :

   ```
   votredomaine.com/*
   ```

   ```
   *.votredomaine.com/*
   ```

### 5.2 Restreindre par API (RECOMMANDÉ)

1. Dans "Restrictions liées aux API", sélectionnez **"Restreindre la clé"**
2. Dans la liste déroulante, cochez **UNIQUEMENT** ces APIs :
   - ✅ **Maps JavaScript API**
   - ✅ **Places API**
   - ✅ **Geocoding API**
   - ✅ **Distance Matrix API**
3. Cliquez sur **"OK"** puis **"ENREGISTRER"**

---

## ÉTAPE 6 : INTÉGRER LA CLÉ DANS VOTRE PROJET

### 6.1 Ouvrir le fichier .env

Ouvrez le fichier `.env` à la racine de votre projet.

### 6.2 Remplacer la clé Google Maps

Trouvez ces lignes :

```env
# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg
# For Edge Functions (server-side only, not exposed to frontend)
GOOGLE_MAPS_API_KEY=AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg
```

Remplacez par votre nouvelle clé :

```env
# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=VOTRE_NOUVELLE_CLE_ICI
# For Edge Functions (server-side only, not exposed to frontend)
GOOGLE_MAPS_API_KEY=VOTRE_NOUVELLE_CLE_ICI
```

**Exemple avec une clé fictive** :

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAbCdEf123456789GhIjKlMnOpQrStUvWxYz
GOOGLE_MAPS_API_KEY=AIzaSyAbCdEf123456789GhIjKlMnOpQrStUvWxYz
```

### 6.3 Sauvegarder le fichier

**IMPORTANT** : Sauvegardez le fichier `.env` (Ctrl+S ou Cmd+S)

---

## ÉTAPE 7 : CONFIGURER LES SECRETS SUPABASE (POUR EDGE FUNCTIONS)

Pour que les Edge Functions (backend) fonctionnent avec Google Maps :

### 7.1 Accéder à Supabase Dashboard

1. Allez sur : **https://supabase.com/dashboard**
2. Sélectionnez votre projet `TrouveTonDemenageur`

### 7.2 Ajouter le secret

1. Dans le menu de gauche, cliquez sur **"Project Settings"** (icône engrenage)
2. Cliquez sur **"Edge Functions"** dans le sous-menu
3. Faites défiler jusqu'à **"Secrets"**
4. Cliquez sur **"Add secret"**
5. Remplissez :
   - **Name** : `GOOGLE_MAPS_API_KEY`
   - **Value** : Votre clé Google Maps (la même que dans .env)
6. Cliquez sur **"Add secret"**

---

## ÉTAPE 8 : REDÉMARRER L'APPLICATION

### 8.1 Arrêter le serveur de développement

Si votre application tourne déjà :
1. Dans le terminal, appuyez sur **Ctrl+C**
2. Attendez que le serveur s'arrête

### 8.2 Redémarrer avec la nouvelle clé

```bash
npm run dev
```

**IMPORTANT** : Le redémarrage est OBLIGATOIRE pour que les nouvelles variables d'environnement soient prises en compte.

---

## ÉTAPE 9 : TESTER L'AUTOCOMPLÉTION

### 9.1 Ouvrir le fichier de test

Dans votre navigateur, ouvrez :

```
http://localhost:5173
```

### 9.2 Tester sur le formulaire de devis

1. Allez sur la page de demande de devis
2. Cliquez sur le champ **"Adresse de départ"**
3. Commencez à taper : `10 rue de la`
4. **Des suggestions doivent apparaître immédiatement**

### 9.3 Vérifier la console (si problème)

Si l'autocomplétion ne fonctionne pas :

1. Appuyez sur **F12** pour ouvrir la console développeur
2. Regardez l'onglet **"Console"**
3. Cherchez des erreurs en rouge avec "Google Maps" ou "Places API"

**Erreurs courantes** :

- `RefererNotAllowedMapError` → Ajoutez votre domaine dans les restrictions HTTP referrers
- `ApiNotActivatedMapError` → Places API n'est pas activée (retour étape 3)
- `RequestDenied` → Compte de facturation non configuré (retour étape 2)
- `InvalidKeyMapError` → La clé est invalide ou mal copiée

---

## ÉTAPE 10 : CONFIGURER LES QUOTAS (OPTIONNEL)

Pour éviter les coûts inattendus :

### 10.1 Définir des limites de quota

1. Dans Google Cloud Console, allez dans **"APIs et services"** → **"Quotas"**
2. Filtrez par : `Places API`
3. Cliquez sur **"Places API - Requests per day"**
4. Cliquez sur **"MODIFIER LE QUOTA"**
5. Définissez une limite personnalisée :
   - Développement : **5,000 requêtes/jour**
   - Production : **10,000-50,000 requêtes/jour**
6. Cliquez sur **"SUIVANT"** → **"ENVOYER LA DEMANDE"**

### 10.2 Configurer les alertes budgétaires

1. Allez dans **"Facturation"** → **"Budgets et alertes"**
2. Cliquez sur **"CRÉER UN BUDGET"**
3. Configurez :
   - **Nom** : `Google Maps - Alerte mensuelle`
   - **Budget mensuel** : `20 EUR` (ou votre limite)
   - **Seuils d'alerte** : 50%, 75%, 90%, 100%
4. **Ajoutez votre email** pour recevoir les alertes
5. Cliquez sur **"TERMINER"**

---

## LIMITES GRATUITES GOOGLE MAPS

### Crédits mensuels gratuits

Google offre **$200 de crédit GRATUIT par mois**, ce qui couvre :

| API | Requêtes gratuites/mois | Dépassement |
|-----|------------------------|-------------|
| **Maps JavaScript API** | 28,000 chargements | $7 / 1000 ensuite |
| **Places API (Autocomplete)** | 17,000 requêtes | $2.83 / 1000 ensuite |
| **Geocoding API** | 40,000 requêtes | $5 / 1000 ensuite |
| **Distance Matrix API** | 40,000 requêtes | $5 / 1000 ensuite |

**Pour une plateforme de déménagement** :
- **Développement** : 100% gratuit (usage faible)
- **Production légère** : 100% gratuit avec $200/mois
- **Production intensive** : ~20-50€/mois si dépassement

---

## DÉPANNAGE

### Problème : "Google Maps is not defined"

**Cause** : Le script ne se charge pas

**Solution** :
1. Vérifiez que la clé est bien dans `.env`
2. Redémarrez le serveur (`npm run dev`)
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Problème : "This API project is not authorized to use this API"

**Cause** : Places API non activée

**Solution** :
1. Retournez à l'étape 3
2. Activez Places API
3. Attendez 2 minutes pour la propagation

### Problème : "RefererNotAllowedMapError"

**Cause** : Votre domaine n'est pas dans les restrictions

**Solution** :
1. Allez dans Google Cloud Console → Identifiants
2. Cliquez sur votre clé API
3. Ajoutez `localhost/*` et `127.0.0.1/*` dans les référents HTTP

### Problème : "REQUEST_DENIED because of insufficient billing tier"

**Cause** : Compte de facturation non configuré

**Solution** :
1. Retournez à l'étape 2
2. Configurez le compte de facturation
3. Associez-le à votre projet

---

## CHECKLIST FINALE

Avant de considérer que tout fonctionne :

- [ ] Projet Google Cloud créé
- [ ] Compte de facturation configuré et associé
- [ ] 4 APIs activées (Maps JS, Places, Geocoding, Distance Matrix)
- [ ] Clé API créée et copiée
- [ ] Restrictions HTTP referrers configurées
- [ ] Restrictions API configurées
- [ ] Clé ajoutée dans `.env` (2 lignes)
- [ ] Secret Supabase configuré
- [ ] Application redémarrée
- [ ] Autocomplétion testée et fonctionnelle

---

## SÉCURITÉ - BONNES PRATIQUES

### À FAIRE

✅ Configurer les restrictions HTTP referrers
✅ Restreindre la clé aux APIs nécessaires
✅ Définir des quotas pour éviter les abus
✅ Configurer des alertes budgétaires
✅ Garder la clé dans `.env` (jamais commitée dans Git)

### À NE PAS FAIRE

❌ Publier la clé sur GitHub
❌ Laisser la clé sans restrictions
❌ Utiliser la même clé pour dev et production
❌ Oublier de configurer les alertes budgétaires

---

## RESSOURCES UTILES

**Liens officiels** :
- Console Google Cloud : https://console.cloud.google.com
- Documentation Maps JavaScript API : https://developers.google.com/maps/documentation/javascript
- Documentation Places API : https://developers.google.com/maps/documentation/places/web-service
- Tarification : https://mapsplatform.google.com/pricing/

**Liens rapides** :
- Bibliothèque APIs : https://console.cloud.google.com/apis/library
- Identifiants : https://console.cloud.google.com/apis/credentials
- Facturation : https://console.cloud.google.com/billing
- Quotas : https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas

---

## STATUT ACTUEL DE VOS CLÉS API

### ✅ Clés déjà configurées dans .env

| API | Clé | Statut |
|-----|-----|--------|
| **Supabase** | `eyJhbGciOiJIUzI1...` | ✅ Configurée |
| **Resend** | `re_hGyCW5pm_G...` | ✅ Configurée |
| **OpenAI** | `sk-proj-Xdf4oZ...` | ✅ Configurée |
| **Google Maps** | `AIzaSyBabRmqk...` | ⚠️ À remplacer |
| **Stripe** | `pk_test_51QNeed...` | ⚠️ À configurer |

### Actions requises

1. **Google Maps** : Suivre ce guide pour créer une nouvelle clé
2. **Stripe** : Obtenir les clés de test sur https://dashboard.stripe.com/test/apikeys

---

## SUPPORT

Si vous rencontrez des problèmes après avoir suivi ce guide :

1. Consultez le fichier `DIAGNOSTIC_GOOGLE_MAPS.md`
2. Ouvrez le fichier `test-google-maps.html` dans votre navigateur
3. Vérifiez la console développeur (F12)
4. Contactez le support avec :
   - Le message d'erreur exact
   - Le résultat du test `test-google-maps.html`
   - Une capture de vos APIs activées dans Google Cloud Console

**Temps de propagation** : Comptez 1-2 minutes après toute modification dans Google Cloud Console.
