# Système complet de notifications pour les admins

## Vue d'ensemble

Toutes les actions importantes sur la plateforme génèrent maintenant automatiquement des notifications pour les admins grâce à des triggers de base de données.

## Notifications automatiques mises en place

### 1. Inscription d'un nouveau client
**Déclencheur :** Insertion dans la table `clients`
**Type de notification :** `client_registration`
**Message :** "Un nouveau client s'est inscrit: [Nom Prénom] (email@example.com)"
**Fichier migration :** `create_clients_table_with_notifications.sql`

### 2. Inscription d'un nouveau déménageur
**Déclencheur :** Insertion dans la table `movers`
**Type de notification :** `mover_registration`
**Message :** "Un nouveau déménageur s'est inscrit: [Nom entreprise]"
**Fichier migration :** `add_user_functions_and_signup_notifications.sql` (existant)

### 3. Nouvelle demande de devis
**Déclencheur :** Insertion dans la table `quote_requests`
**Type de notification :** `new_quote_request`
**Message :** "Nouvelle demande de déménagement: Paris (75001) → Lyon (69001) le 15/01/2026"
**Fichier migration :** `complete_admin_notifications_system.sql`

### 4. Nouveau devis émis par un déménageur
**Déclencheur :** Insertion dans la table `quotes`
**Type de notification :** `new_quote`
**Message :** "Le déménageur [Nom] a émis un devis pour Paris → Lyon (1500€)"
**Fichier migration :** `complete_admin_notifications_system.sql`

### 5. Modification d'un devis par un déménageur
**Déclencheur :** Mise à jour du prix ou du message dans la table `quotes`
**Type de notification :** `quote_update`
**Message :** "Le déménageur [Nom] a modifié son devis pour Paris → Lyon (Prix: 1500€ → 1400€)"
**Fichier migration :** `complete_admin_notifications_system.sql`

### 6. Modification d'une demande par un client
**Déclencheur :** Mise à jour dans la table `quote_requests`
**Type de notification :** `quote_update`
**Message :** "La demande Paris → Lyon a été modifiée"
**Fichier migration :** `fix_notifications_trigger_add_user_type.sql` (existant)

## Architecture technique

### Triggers de base de données
Tous les triggers utilisent :
- `SECURITY DEFINER` pour s'exécuter avec les privilèges appropriés
- `SET search_path = public` pour la sécurité
- Boucle `FOR ... IN ... LOOP` pour notifier tous les admins

### Format des notifications
```sql
INSERT INTO notifications (
  user_id,        -- ID de l'admin à notifier
  user_type,      -- 'admin'
  type,           -- Type de notification
  title,          -- Titre court
  message,        -- Message détaillé
  related_id,     -- ID de l'entité concernée (optionnel)
  created_at      -- Date/heure de création
)
```

## Avantages de cette approche

1. **Fiabilité maximale** : Les notifications sont créées au niveau de la base de données, impossible de les manquer
2. **Cohérence** : Même format pour toutes les notifications
3. **Performance** : Les triggers sont optimisés et n'impactent pas les temps de réponse
4. **Maintenance** : Code centralisé dans les migrations, facile à maintenir
5. **Audit** : Toutes les actions importantes sont tracées

## Table clients créée

Une nouvelle table `clients` a été créée pour stocker les informations des clients :

### Colonnes
- `id` : UUID (clé primaire)
- `user_id` : UUID (référence à auth.users, unique)
- `email` : Text
- `first_name` : Text (prénom)
- `last_name` : Text (nom)
- `phone` : Text (téléphone)
- `created_at` : Timestamp avec timezone
- `updated_at` : Timestamp avec timezone

### Sécurité (RLS)
- Les clients peuvent voir/modifier leur propre profil
- Les admins peuvent voir/modifier tous les profils clients
- Trigger de notification automatique lors de l'insertion

## Modifications du code

### AuthContext.tsx
- Suppression du code manuel de notification (géré par trigger)
- Suppression de la vérification d'existence du client
- Conservation de l'envoi de l'email de bienvenue

### ClientProfileCompletionPage.tsx
- Insertion dans la table `clients` après inscription
- Trigger automatique de notification aux admins

## Test du système

Pour tester les notifications :

1. **Inscription client** : Créez un nouveau compte client → Les admins reçoivent une notification
2. **Nouvelle demande** : Créez une demande de devis → Les admins reçoivent une notification
3. **Nouveau devis** : Un déménageur soumet un devis → Les admins reçoivent une notification
4. **Modification devis** : Un déménageur modifie son devis → Les admins reçoivent une notification
5. **Modification demande** : Un client modifie sa demande → Les admins et déménageurs concernés reçoivent une notification

## Logs et débogage

Pour vérifier que les triggers fonctionnent :
1. Allez dans Supabase Dashboard → Logs → Database
2. Filtrez par type "INFO" ou "ERROR"
3. Recherchez les logs des fonctions `notify_admins_*`

## Types de notifications disponibles

- `client_registration` : Inscription client
- `mover_registration` : Inscription déménageur
- `new_quote_request` : Nouvelle demande de devis
- `new_quote` : Nouveau devis
- `quote_update` : Modification de devis ou demande
- `system` : Notifications système diverses
- `payment` : Notifications de paiement
- `message` : Nouveaux messages
- `status_change` : Changement de statut
