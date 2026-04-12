-- Script pour supprimer le compte client test cocodj100@gmail.com
-- À exécuter dans le SQL Editor de Supabase

DO $$
DECLARE
  client_user_id uuid;
BEGIN
  -- Trouver l'ID utilisateur du client
  SELECT user_id INTO client_user_id
  FROM clients
  WHERE email = 'cocodj100@gmail.com';

  IF client_user_id IS NOT NULL THEN
    -- Supprimer toutes les données associées

    -- 1. Supprimer les notifications
    DELETE FROM notifications WHERE user_id = client_user_id;

    -- 2. Supprimer les messages
    DELETE FROM messages WHERE client_id = client_user_id;

    -- 3. Supprimer les reviews
    DELETE FROM reviews WHERE client_id = client_user_id;

    -- 4. Supprimer les paiements
    DELETE FROM payments WHERE client_id = client_user_id;

    -- 5. Supprimer les devis (quotes) associés aux demandes du client
    DELETE FROM quotes WHERE quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = client_user_id
    );

    -- 6. Supprimer les demandes de devis
    DELETE FROM quote_requests WHERE client_user_id = client_user_id;

    -- 7. Supprimer le profil client
    DELETE FROM clients WHERE user_id = client_user_id;

    -- 8. Supprimer l'utilisateur auth
    DELETE FROM auth.users WHERE id = client_user_id;

    RAISE NOTICE 'Compte client cocodj100@gmail.com supprimé avec succès';
  ELSE
    RAISE NOTICE 'Aucun compte trouvé avec l''email cocodj100@gmail.com';
  END IF;
END $$;
