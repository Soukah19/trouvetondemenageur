# Comptes Administrateurs - Connexion par Username

## Configuration Finale

La connexion admin utilise maintenant un **nom d'utilisateur** au lieu d'une adresse email.

## Comptes Administrateurs

### Super Administrateur
- **Username**: `superadmin`
- **Mot de passe**: `123456`
- **Role**: Super Administrateur
- **Permissions**: Accès complet à toutes les fonctionnalités

### Agent Administratif
- **Username**: `adminagent`
- **Mot de passe**: `123456`
- **Role**: Agent Administratif
- **Permissions**: Accès limité (pas d'accès aux finances)

## Comment se connecter

1. Allez sur la page de connexion admin
2. Entrez le **nom d'utilisateur** (pas d'email):
   - `superadmin` ou `adminagent`
3. Entrez le mot de passe correspondant
4. Cliquez sur "Se connecter"

## État de la Base de Données

- **Admins**: 2 (superadmin@trouveton.fr supprimé le 19/01/2026)
- **Clients**: 0
- **Déménageurs**: 0
- **Demandes de devis**: 0
- **Notifications**: 0

## Comptes Actifs

### 1. Super Admin Principal
- Email: `admin@trouveton.fr`
- Username: `admin`
- Mot de passe: `123456`

### 2. Agent Admin
- Email: `adminagent@trouveton.fr`
- Username: `adminagent`
- Mot de passe: `123456`

## Prêt pour les Tests

La plateforme est maintenant propre et prête pour tester l'inscription d'un nouveau client.

Quand un client s'inscrira:
1. Il ne recevra PAS de notification d'inscription
2. Les 2 admins recevront une notification dans leur dashboard
3. Le client apparaîtra dans les statistiques (Clients Actifs)
4. Le client apparaîtra dans l'onglet "Utilisateurs" du dashboard admin
