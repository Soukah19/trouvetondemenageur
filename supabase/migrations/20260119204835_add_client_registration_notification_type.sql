/*
  # Ajouter le type client_registration aux notifications

  1. Modifications
    - Ajouter 'client_registration' à la contrainte de type des notifications
    - Permet au système de notifier les admins lors de l'inscription d'un nouveau client

  2. Sécurité
    - Aucun changement de sécurité, uniquement ajout d'un type de notification
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
    'client_registration'::text
  ]));
