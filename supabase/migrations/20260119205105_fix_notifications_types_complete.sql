/*
  # Corriger tous les types de notifications manquants

  1. Modifications
    - Ajouter 'urgent_quote_request' pour les alertes urgentes
    - Ajouter 'new_quote_request' pour les nouvelles demandes
    - Ajouter 'quote_update' pour les mises à jour de devis
    - Correction complète de la contrainte CHECK

  2. Impact
    - Débloquer le système d'alertes urgentes
    - Permettre toutes les notifications du système
    - Corriger les erreurs d'insertion de notifications
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Recréer la contrainte avec TOUS les types nécessaires
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
    'urgent_quote_request'::text,
    'new_quote_request'::text,
    'quote_update'::text
  ]));
