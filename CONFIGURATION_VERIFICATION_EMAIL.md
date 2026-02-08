# Configuration de la vérification par email

Ce document explique comment activer et configurer le système de vérification par email pour les clients.

## État actuel

Le système de vérification par email est **INTÉGRÉ MAIS DÉSACTIVÉ** par défaut. Il sera activé une fois que toutes les clés API seront configurées.

## Fonctionnalités implémentées

1. **Page de vérification d'email** (`EmailVerificationPage.tsx`)
   - Gère le callback de vérification depuis l'email
   - Redirige automatiquement vers l'espace client après vérification

2. **Page de confirmation** (`CheckEmailPage.tsx`)
   - Affichée après inscription
   - Informe l'utilisateur de vérifier son email
   - Permet de renvoyer l'email de vérification

3. **Page de renvoi** (`ResendVerificationPage.tsx`)
   - Permet aux utilisateurs de demander un nouvel email de vérification

4. **Contexte d'authentification modifié**
   - Configuration de l'URL de redirection après vérification
   - Gestion du statut de vérification d'email

## Comment activer la vérification par email

### Étape 1 : Configuration dans Supabase Dashboard

1. Connectez-vous à votre [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **Settings**
4. Activez **Email Confirmation** (confirmation d'email)
5. Configurez l'URL de redirection :
   - URL de redirection : `https://votre-domaine.com/verify-email`
   - Pour le développement local : `http://localhost:5173/verify-email`

### Étape 2 : Configuration du template d'email

1. Dans Supabase Dashboard, allez dans **Authentication** → **Email Templates**
2. Sélectionnez le template **Confirm signup**
3. Personnalisez le contenu si nécessaire
4. Le lien de vérification utilisera automatiquement l'URL configurée

### Étape 3 : Variable d'environnement

Ajoutez cette variable dans votre fichier `.env` :

```
VITE_ENABLE_EMAIL_VERIFICATION=true
```

Pour désactiver (mode actuel) :
```
VITE_ENABLE_EMAIL_VERIFICATION=false
```

### Étape 4 : Modifier la logique d'inscription

Dans `src/contexts/AuthContext.tsx`, la fonction `signUp` est déjà configurée pour gérer la vérification :

```typescript
const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/verify-email`
    }
  });
  if (error) throw error;
  return data;
};
```

### Étape 5 : Configuration du routing

Les routes suivantes sont disponibles dans l'application :

- `/verify-email` - Page de callback pour la vérification
- `/check-email` - Page affichée après inscription
- `/resend-verification` - Page pour renvoyer l'email

## Flux utilisateur avec vérification activée

1. **Inscription**
   - L'utilisateur remplit le formulaire d'inscription
   - Un compte est créé mais non vérifié
   - L'utilisateur est redirigé vers `/check-email`

2. **Vérification**
   - L'utilisateur reçoit un email avec un lien
   - En cliquant sur le lien, il est redirigé vers `/verify-email`
   - Le système vérifie automatiquement le compte
   - L'utilisateur est redirigé vers son espace client

3. **Accès restreint**
   - Sans vérification, l'utilisateur peut se connecter mais ne peut pas créer de demande de devis
   - Un message l'invite à vérifier son email

## Flux utilisateur sans vérification (mode actuel)

1. **Inscription**
   - L'utilisateur remplit le formulaire d'inscription
   - Un compte est créé et immédiatement actif
   - L'utilisateur peut directement créer des demandes de devis

## Configuration SMTP (Emails transactionnels)

Par défaut, Supabase utilise son propre service d'envoi d'emails. Pour la production, configurez un service SMTP personnalisé :

1. Dans Supabase Dashboard : **Project Settings** → **Auth** → **SMTP Settings**
2. Configurez votre service SMTP (SendGrid, Mailgun, AWS SES, etc.)
3. Testez l'envoi d'emails

## Sécurité

- Les liens de vérification expirent après 24 heures
- Un utilisateur non vérifié ne peut pas effectuer d'actions critiques
- Les tokens de vérification sont à usage unique
- Tous les tokens sont stockés de manière sécurisée dans Supabase

## Dépannage

### L'email n'est pas reçu
- Vérifiez le dossier spam
- Vérifiez la configuration SMTP dans Supabase
- Vérifiez les logs dans Supabase Dashboard → Authentication → Logs

### Le lien de vérification ne fonctionne pas
- Vérifiez que l'URL de redirection est correctement configurée
- Vérifiez que le lien n'a pas expiré (24h)
- Utilisez la fonction "Renvoyer l'email"

### L'utilisateur reste non vérifié
- Vérifiez dans Supabase Dashboard → Authentication → Users
- Vous pouvez manuellement marquer un email comme vérifié si nécessaire

## Migration des utilisateurs existants

Si vous activez la vérification après avoir déjà des utilisateurs :

```sql
-- Marquer tous les utilisateurs existants comme vérifiés
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

## Prochaines étapes

Quand vous serez prêt à activer la vérification :

1. Configurez un service SMTP professionnel
2. Personnalisez les templates d'email avec votre marque
3. Testez le flux complet en environnement de test
4. Activez la variable d'environnement
5. Déployez les changements
