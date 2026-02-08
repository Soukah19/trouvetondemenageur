/*
  # Fonction pour supprimer automatiquement un compte déménageur

  1. Nouvelle fonction
    - `delete_mover_account(mover_user_id uuid)` - Supprime complètement un compte déménageur et toutes ses données associées
  
  2. Objectif
    - Faciliter les tests en permettant de réutiliser les mêmes informations (SIRET, documents, etc.)
    - Nettoyage automatique des anciens comptes de test
  
  3. Sécurité
    - Cette fonction est accessible uniquement aux utilisateurs authentifiés
    - Elle supprime toutes les données liées au déménageur
*/

-- Créer la fonction de suppression de compte déménageur
CREATE OR REPLACE FUNCTION delete_mover_account(mover_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mover_uuid uuid;
BEGIN
  -- Récupérer l'ID du déménageur
  SELECT id INTO mover_uuid FROM movers WHERE user_id = mover_user_id;
  
  IF mover_uuid IS NULL THEN
    RETURN; -- Pas de déménageur trouvé, rien à faire
  END IF;

  -- Supprimer toutes les données associées
  DELETE FROM mover_documents WHERE mover_id = mover_uuid;
  DELETE FROM trucks WHERE mover_id = mover_uuid;
  DELETE FROM identity_verifications WHERE mover_id = mover_uuid;
  DELETE FROM verification_reports WHERE mover_id = mover_uuid;
  DELETE FROM mover_unavailability WHERE mover_id = mover_uuid;
  DELETE FROM favorites WHERE mover_id = mover_uuid;
  DELETE FROM mover_badges WHERE mover_id = mover_uuid;
  DELETE FROM mover_portfolio WHERE mover_id = mover_uuid;
  DELETE FROM reviews WHERE mover_id = mover_uuid;
  DELETE FROM messages WHERE sender_id = mover_user_id;
  DELETE FROM conversations WHERE mover_id = mover_uuid;
  DELETE FROM notifications WHERE user_id = mover_user_id;
  DELETE FROM notification_queue WHERE mover_id = mover_uuid;
  DELETE FROM quotes WHERE mover_id = mover_uuid;
  DELETE FROM payments WHERE mover_id = mover_uuid;
  DELETE FROM quote_requests WHERE client_user_id = mover_user_id;
  DELETE FROM contracts WHERE mover_id = mover_uuid;
  DELETE FROM accepted_moves WHERE mover_id = mover_uuid;
  DELETE FROM document_verifications WHERE user_id = mover_user_id;
  DELETE FROM contract_signatures WHERE signer_id = mover_user_id;
  DELETE FROM fraud_alerts WHERE user_id = mover_user_id;
  DELETE FROM user_checklist_items WHERE user_id = mover_user_id;
  DELETE FROM inventory_items WHERE user_id = mover_user_id;
  DELETE FROM activity_timeline WHERE user_id = mover_user_id;
  
  -- Supprimer le profil déménageur
  DELETE FROM movers WHERE id = mover_uuid;
  
  -- Supprimer l'utilisateur auth (supprime aussi les fichiers storage via cascade)
  DELETE FROM auth.users WHERE id = mover_user_id;
END;
$$;

-- Accorder les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION delete_mover_account(uuid) TO authenticated;
