-- Script de nettoyage complet de la base de données
-- Supprime toutes les données de test tout en préservant les comptes admin

-- Désactiver temporairement les triggers
SET session_replication_role = replica;

-- Supprimer tous les remboursements
DELETE FROM refunds;

-- Supprimer toutes les demandes de déblocage
DELETE FROM payment_release_requests;

-- Supprimer tous les paiements
DELETE FROM payments;

-- Supprimer toutes les annulations
DELETE FROM cancellations;

-- Supprimer tous les devis
DELETE FROM quotes;

-- Supprimer toutes les demandes de devis
DELETE FROM quote_requests;

-- Supprimer tous les messages et conversations
DELETE FROM messages;
DELETE FROM conversations;

-- Supprimer toutes les notifications et files d'attente
DELETE FROM notifications;
DELETE FROM notification_queue;

-- Supprimer toutes les photos de déménagement
DELETE FROM moving_photos;

-- Supprimer tous les rapports de dommages
DELETE FROM damage_reports;

-- Supprimer toutes les reviews
DELETE FROM reviews;

-- Supprimer tous les favoris
DELETE FROM favorites;

-- Supprimer tous les contrats et signatures
DELETE FROM contract_signatures;
DELETE FROM contracts;

-- Supprimer toutes les vérifications de documents
DELETE FROM document_verifications;

-- Supprimer tous les documents des déménageurs
DELETE FROM mover_documents;

-- Supprimer toutes les vérifications d'identité
DELETE FROM identity_verifications;

-- Supprimer tous les rapports de vérification
DELETE FROM verification_reports;

-- Supprimer tous les camions
DELETE FROM trucks;

-- Supprimer toutes les disponibilités
DELETE FROM mover_unavailability;

-- Supprimer tous les mouvements acceptés (missions)
DELETE FROM accepted_moves;

-- Supprimer toutes les alertes de fraude
DELETE FROM fraud_alerts;

-- Supprimer tous les items d'inventaire et checklist
DELETE FROM inventory_items;
DELETE FROM user_checklist_items;

-- Supprimer tous les portfolios de déménageurs
DELETE FROM mover_portfolio;

-- Supprimer tous les badges
DELETE FROM mover_badges;

-- Supprimer tous les statuts de déménagement
DELETE FROM moving_status;

-- Supprimer toutes les activités
DELETE FROM activity_timeline;

-- Supprimer tous les déménageurs (et leurs utilisateurs associés)
DO $$
DECLARE
  mover_record RECORD;
BEGIN
  FOR mover_record IN
    SELECT user_id FROM movers
  LOOP
    -- Supprimer le profil déménageur
    DELETE FROM movers WHERE user_id = mover_record.user_id;
    -- Supprimer l'utilisateur auth
    DELETE FROM auth.users WHERE id = mover_record.user_id;
  END LOOP;
END $$;

-- Supprimer tous les clients (utilisateurs qui ne sont ni déménageurs ni admins)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM movers)
    AND id NOT IN (SELECT user_id FROM admins)
  LOOP
    DELETE FROM auth.users WHERE id = user_record.id;
  END LOOP;
END $$;

-- Réactiver les triggers
SET session_replication_role = DEFAULT;

-- Afficher un résumé
DO $$
DECLARE
  mover_count INT;
  user_count INT;
  admin_count INT;
  quote_count INT;
  payment_count INT;
BEGIN
  SELECT COUNT(*) INTO mover_count FROM movers;
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO admin_count FROM admins;
  SELECT COUNT(*) INTO quote_count FROM quotes;
  SELECT COUNT(*) INTO payment_count FROM payments;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'NETTOYAGE TERMINÉ';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Déménageurs restants: %', mover_count;
  RAISE NOTICE 'Utilisateurs restants: %', user_count;
  RAISE NOTICE 'Admins préservés: %', admin_count;
  RAISE NOTICE 'Devis restants: %', quote_count;
  RAISE NOTICE 'Paiements restants: %', payment_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'La base de données est prête pour des tests propres';
  RAISE NOTICE '================================================';
END $$;
