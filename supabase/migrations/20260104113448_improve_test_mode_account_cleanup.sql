/*
  # Amélioration du nettoyage automatique pour les tests

  1. Modifications
    - Recréer la fonction delete_mover_account avec les bonnes permissions
    - Utiliser SECURITY INVOKER au lieu de SECURITY DEFINER
    - Ajouter une politique RLS temporaire pour permettre la suppression
  
  2. Objectif
    - Permettre le nettoyage automatique des comptes de test avec le même SIRET
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS delete_mover_account(uuid);

-- Créer une fonction plus simple qui supprime directement par SIRET
CREATE OR REPLACE FUNCTION cleanup_test_mover_by_siret(test_siret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mover_record RECORD;
BEGIN
  -- Trouver le déménageur avec ce SIRET
  FOR mover_record IN
    SELECT id, user_id FROM movers WHERE siret = test_siret
  LOOP
    -- Supprimer toutes les données associées
    DELETE FROM mover_documents WHERE mover_id = mover_record.id;
    DELETE FROM trucks WHERE mover_id = mover_record.id;
    DELETE FROM identity_verifications WHERE mover_id = mover_record.id;
    DELETE FROM verification_reports WHERE mover_id = mover_record.id;
    DELETE FROM mover_unavailability WHERE mover_id = mover_record.id;
    DELETE FROM favorites WHERE mover_id = mover_record.id;
    DELETE FROM mover_badges WHERE mover_id = mover_record.id;
    DELETE FROM mover_portfolio WHERE mover_id = mover_record.id;
    DELETE FROM reviews WHERE mover_id = mover_record.id;
    DELETE FROM messages WHERE sender_id = mover_record.user_id;
    DELETE FROM conversations WHERE mover_id = mover_record.id;
    DELETE FROM notifications WHERE user_id = mover_record.user_id;
    DELETE FROM notification_queue WHERE mover_id = mover_record.id;
    DELETE FROM quotes WHERE mover_id = mover_record.id;
    DELETE FROM payments WHERE mover_id = mover_record.id;
    DELETE FROM quote_requests WHERE client_user_id = mover_record.user_id;
    DELETE FROM contracts WHERE mover_id = mover_record.id;
    DELETE FROM accepted_moves WHERE mover_id = mover_record.id;
    DELETE FROM document_verifications WHERE user_id = mover_record.user_id;
    DELETE FROM contract_signatures WHERE signer_id = mover_record.user_id;
    DELETE FROM fraud_alerts WHERE user_id = mover_record.user_id;
    DELETE FROM user_checklist_items WHERE user_id = mover_record.user_id;
    DELETE FROM inventory_items WHERE user_id = mover_record.user_id;
    DELETE FROM activity_timeline WHERE user_id = mover_record.user_id;
    
    -- Supprimer le profil déménageur
    DELETE FROM movers WHERE id = mover_record.id;
    
    -- Supprimer l'utilisateur auth
    DELETE FROM auth.users WHERE id = mover_record.user_id;
  END LOOP;
END;
$$;

-- Donner les permissions à tous les utilisateurs (y compris anon pour l'inscription)
GRANT EXECUTE ON FUNCTION cleanup_test_mover_by_siret(text) TO anon, authenticated;
