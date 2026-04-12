/*
  # Correction : Ajout des types manquants pour les notifications

  1. Problème
    - Les types 'client_registration' et 'new_quote_request' ne sont pas dans la contrainte CHECK
    - Cela cause une erreur lors de l'inscription des clients

  2. Solution
    - Modifier la contrainte CHECK pour ajouter ces types
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Créer la nouvelle contrainte avec tous les types nécessaires
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'new_quote'::text, 
  'quote_accepted'::text, 
  'message'::text, 
  'status_change'::text, 
  'review'::text, 
  'payment'::text, 
  'damage_report'::text, 
  'system'::text, 
  'mover_registration'::text, 
  'client_registration'::text,
  'new_quote_request'::text,
  'quote_update'::text
]));