# Configuration de l'authentification Google

Ce guide explique comment configurer l'authentification Google OAuth pour la plateforme TrouveTonDemenageur.

## Vue d'ensemble

L'authentification Google a été ajoutée pour les clients et les déménageurs, permettant une connexion rapide et sécurisée sans avoir à créer un mot de passe.

## Étapes de configuration dans Supabase

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ si ce n'est pas déjà fait

### 2. Configurer l'écran de consentement OAuth

1. Dans Google Cloud Console, allez dans **APIs & Services** > **OAuth consent screen**
2. Choisissez le type d'utilisateur (External pour les utilisateurs publics)
3. Remplissez les informations requises :
   - Nom de l'application : TrouveTonDemenageur
   - Email de support utilisateur
   - Domaine de l'application
   - Informations de contact du développeur

### 3. Créer les identifiants OAuth 2.0

1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Sélectionnez **Web application**
4. Configurez les URIs autorisées :
   - **Authorized JavaScript origins** :
     - `http://localhost:5173` (développement)
     - `https://votre-domaine.com` (production)
   - **Authorized redirect URIs** :
     - `https://votre-projet.supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (si Supabase local)

5. Copiez le **Client ID** et le **Client Secret**

### 4. Configurer Supabase

1. Allez dans votre projet Supabase Dashboard
2. Naviguez vers **Authentication** > **Providers**
3. Activez **Google**
4. Entrez les informations copiées :
   - **Client ID** : votre Client ID Google
   - **Client Secret** : votre Client Secret Google
5. Cliquez sur **Save**

### 5. Configurer les URLs de redirection dans Supabase

1. Dans **Authentication** > **URL Configuration**
2. Ajoutez les URLs de redirection autorisées :
   - `http://localhost:5173/client/profile-completion`
   - `http://localhost:5173/mover/signup`
   - `https://votre-domaine.com/client/profile-completion`
   - `https://votre-domaine.com/mover/signup`

## Fonctionnement

### Pour les clients

1. L'utilisateur clique sur "Continuer avec Google" sur la page de connexion client
2. Il est redirigé vers Google pour s'authentifier
3. Après authentification, il est redirigé vers `/client/profile-completion`
4. Un profil client est automatiquement créé dans la table `clients`
5. L'utilisateur complète son profil (nom, prénom, téléphone)

### Pour les déménageurs

1. L'utilisateur clique sur "Continuer avec Google" sur la page de connexion déménageur
2. Il est redirigé vers Google pour s'authentifier
3. Après authentification, il est redirigé vers `/mover/signup`
4. L'utilisateur complète le formulaire d'inscription déménageur avec tous les détails requis

## Gestion automatique des profils

Le système gère automatiquement la création des profils :

- Lors de la première connexion Google, un profil `clients` est créé automatiquement
- L'email Google est utilisé comme email principal
- Le prénom et nom de famille Google sont disponibles dans `user_metadata`
- Les déménageurs doivent compléter le formulaire d'inscription complet

## Sécurité

- Les tokens OAuth sont gérés de manière sécurisée par Supabase
- Les tokens de rafraîchissement sont utilisés pour maintenir la session
- Aucun mot de passe n'est stocké pour les comptes Google
- Les utilisateurs peuvent se déconnecter normalement

## Tests en développement

Pour tester en local :

1. Assurez-vous que `http://localhost:5173` est dans les origines JavaScript autorisées
2. Assurez-vous que l'URI de callback Supabase est correctement configurée
3. Testez la connexion Google depuis :
   - `/client/auth` (mode login ou signup)
   - `/mover/auth`

## Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URI de redirection Supabase est bien ajoutée dans Google Cloud Console
- Vérifiez que l'URL est exactement la même (avec/sans trailing slash)

### Erreur "invalid_client"
- Vérifiez que le Client ID et Client Secret sont corrects dans Supabase
- Régénérez les credentials si nécessaire

### L'utilisateur est redirigé mais rien ne se passe
- Vérifiez les URLs de redirection dans Supabase Dashboard
- Vérifiez les logs de la console navigateur pour les erreurs
- Vérifiez que les politiques RLS permettent l'insertion dans la table clients

## Fichiers modifiés

- `src/hooks/useNavigationHelpers.ts` : Ajout de `handleGoogleClientLogin` et `handleGoogleMoverLogin`
- `src/pages/ClientAuthPage.tsx` : Ajout du bouton Google et du composant GoogleIcon
- `src/pages/MoverAuthPage.tsx` : Ajout du bouton Google et du composant GoogleIcon
- `src/contexts/AuthContext.tsx` : Gestion automatique de la création du profil client après auth Google

## Notes importantes

- L'authentification Google est en plus de l'authentification email/mot de passe existante
- Les utilisateurs peuvent choisir leur méthode préférée
- Un utilisateur ne peut pas avoir à la fois un compte email/mot de passe et un compte Google avec le même email
- Supabase gère automatiquement la fusion des comptes si nécessaire
