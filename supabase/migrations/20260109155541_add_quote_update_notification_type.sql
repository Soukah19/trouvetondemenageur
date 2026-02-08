/*
  # Ajout du type de notification 'quote_update'
  
  1. Modification
    - Ajoute 'quote_update' aux types de notifications autorisés
    - Permet de notifier lors de modifications de demandes
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Recréer la contrainte avec le nouveau type
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
  'quote_update'::text
]));
