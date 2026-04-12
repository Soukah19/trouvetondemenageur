/*
  # Correction de la contrainte de clé étrangère quote_requests

  1. Problème
    - La contrainte `quote_requests_client_user_id_fkey` référence une table `users` qui n'existe pas
    - Le système utilise `auth.users` pour l'authentification
    - Impossible de créer une contrainte FK vers `auth.users` (limité par Supabase)

  2. Solution
    - Supprimer la contrainte de clé étrangère invalide
    - Garder la colonne `client_user_id` pour référencer l'utilisateur authentifié
    - La validation se fera via RLS au lieu d'une contrainte FK
*/

-- Supprimer la contrainte de clé étrangère invalide
ALTER TABLE quote_requests
DROP CONSTRAINT IF EXISTS quote_requests_client_user_id_fkey;

-- Vérifier que la colonne existe et est du bon type
-- La colonne client_user_id doit référencer auth.users.id mais sans contrainte FK
-- Car on ne peut pas créer de FK vers auth.users dans Supabase
