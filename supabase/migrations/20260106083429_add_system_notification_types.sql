/*
  # Ajout de types de notification pour les inscriptions
  
  1. Modifications
    - Ajout de 'system' aux types de notification autorisés
    - Ajout de 'mover_registration' aux types de notification autorisés
  
  2. Utilisation
    - Permet de notifier les admins lors des inscriptions clients et déménageurs
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Ajouter la nouvelle contrainte avec les nouveaux types
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'new_quote',
    'quote_accepted', 
    'message',
    'status_change',
    'review',
    'payment',
    'damage_report',
    'system',
    'mover_registration'
  ));
