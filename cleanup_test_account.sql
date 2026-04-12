-- Script pour nettoyer un compte de test
-- ATTENTION : À utiliser uniquement en développement !

-- Remplacez 'votre-email@test.fr' par l'email du compte à supprimer

-- 1. Récupérer l'ID utilisateur
DO $$
DECLARE
  test_email TEXT := 'votre-email@test.fr'; -- CHANGEZ ICI
  user_uuid UUID;
  mover_uuid UUID;
BEGIN
  -- Trouver l'utilisateur dans auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = test_email;

  IF user_uuid IS NULL THEN
    RAISE NOTICE 'Aucun utilisateur trouvé avec cet email';
    RETURN;
  END IF;

  RAISE NOTICE 'User ID trouvé: %', user_uuid;

  -- Trouver le profil déménageur
  SELECT id INTO mover_uuid
  FROM movers
  WHERE user_id = user_uuid;

  IF mover_uuid IS NOT NULL THEN
    RAISE NOTICE 'Mover ID trouvé: %', mover_uuid;

    -- Supprimer les camions
    DELETE FROM trucks WHERE mover_id = mover_uuid;
    RAISE NOTICE 'Camions supprimés';

    -- Supprimer les documents
    DELETE FROM mover_documents WHERE mover_id = mover_uuid;
    RAISE NOTICE 'Documents supprimés';

    -- Supprimer les rapports de vérification
    DELETE FROM verification_reports WHERE mover_id = mover_uuid;
    RAISE NOTICE 'Rapports de vérification supprimés';

    -- Supprimer les zones d'activité
    DELETE FROM activity_zones WHERE mover_id = mover_uuid;
    RAISE NOTICE 'Zones d''activité supprimées';

    -- Supprimer les notifications
    DELETE FROM notifications WHERE user_id = user_uuid;
    RAISE NOTICE 'Notifications supprimées';

    -- Supprimer le profil déménageur
    DELETE FROM movers WHERE id = mover_uuid;
    RAISE NOTICE 'Profil déménageur supprimé';
  END IF;

  -- Supprimer l'utilisateur de auth.users (nécessite privilèges admin)
  DELETE FROM auth.users WHERE id = user_uuid;
  RAISE NOTICE 'Utilisateur supprimé de auth.users';

  RAISE NOTICE 'Nettoyage terminé !';
END $$;
