/*
  Script de nettoyage complet pour les tests d'inscription déménageur

  Ce script supprime :
  - Tous les comptes déménageurs de test
  - Leurs documents associés
  - Leurs comptes auth.users
  - Les fichiers dans le storage

  ATTENTION : Ce script est à utiliser UNIQUEMENT en environnement de test !
*/

-- 1. Récupérer tous les user_ids des déménageurs
DO $$
DECLARE
  mover_record RECORD;
  user_uuid uuid;
BEGIN
  -- Pour chaque déménageur
  FOR mover_record IN
    SELECT id, user_id FROM movers
  LOOP
    user_uuid := mover_record.user_id;

    RAISE NOTICE 'Suppression du déménageur ID: %, User ID: %', mover_record.id, user_uuid;

    -- Supprimer les documents du déménageur
    DELETE FROM mover_documents WHERE mover_id = mover_record.id;

    -- Supprimer les camions
    DELETE FROM trucks WHERE mover_id = mover_record.id;

    -- Supprimer les vérifications d'identité
    DELETE FROM identity_verifications WHERE mover_id = mover_record.id;

    -- Supprimer les rapports de vérification
    DELETE FROM verification_reports WHERE mover_id = mover_record.id;

    -- Supprimer les indisponibilités
    DELETE FROM mover_unavailability WHERE mover_id = mover_record.id;

    -- Supprimer les favoris
    DELETE FROM favorites WHERE mover_id = mover_record.id;

    -- Supprimer les badges
    DELETE FROM mover_badges WHERE mover_id = mover_record.id;

    -- Supprimer le portfolio
    DELETE FROM mover_portfolio WHERE mover_id = mover_record.id;

    -- Supprimer les avis
    DELETE FROM reviews WHERE mover_id = mover_record.id;

    -- Supprimer les messages
    DELETE FROM messages WHERE sender_id = user_uuid;

    -- Supprimer les conversations
    DELETE FROM conversations WHERE mover_id = mover_record.id;

    -- Supprimer les notifications
    DELETE FROM notifications WHERE user_id = user_uuid;

    -- Supprimer la file de notifications
    DELETE FROM notification_queue WHERE mover_id = mover_record.id;

    -- Supprimer les offres (quotes)
    DELETE FROM quotes WHERE mover_id = mover_record.id;

    -- Supprimer les paiements
    DELETE FROM payments WHERE mover_id = mover_record.id;

    -- Supprimer les demandes de devis (si le déménageur est propriétaire)
    DELETE FROM quote_requests WHERE client_user_id = user_uuid;

    -- Supprimer les contrats
    DELETE FROM contracts WHERE mover_id = mover_record.id;

    -- Supprimer les déménagements acceptés
    DELETE FROM accepted_moves WHERE mover_id = mover_record.id;

    -- Supprimer les vérifications de documents
    DELETE FROM document_verifications WHERE user_id = user_uuid;

    -- Supprimer les signatures de contrat
    DELETE FROM contract_signatures WHERE signer_id = user_uuid;

    -- Supprimer les alertes de fraude
    DELETE FROM fraud_alerts WHERE user_id = user_uuid;

    -- Supprimer les éléments de checklist
    DELETE FROM user_checklist_items WHERE user_id = user_uuid;

    -- Supprimer les éléments d'inventaire
    DELETE FROM inventory_items WHERE user_id = user_uuid;

    -- Supprimer la timeline d'activité
    DELETE FROM activity_timeline WHERE user_id = user_uuid;

    -- Supprimer le profil déménageur
    DELETE FROM movers WHERE id = mover_record.id;

    -- Supprimer l'utilisateur auth (ceci supprimera aussi les fichiers dans storage via cascade)
    DELETE FROM auth.users WHERE id = user_uuid;

  END LOOP;

  RAISE NOTICE 'Nettoyage terminé avec succès !';
END $$;

-- 2. Vérifier que tout est bien nettoyé
SELECT
  (SELECT COUNT(*) FROM movers) as total_movers,
  (SELECT COUNT(*) FROM mover_documents) as total_documents,
  (SELECT COUNT(*) FROM trucks) as total_trucks,
  (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'role' = 'mover') as total_auth_users;
