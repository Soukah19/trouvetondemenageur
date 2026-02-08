/*
  # Suppression de l'utilisateur auth DROP IT

  Cette migration supprime l'utilisateur auth orphelin pour permettre une nouvelle inscription.
  
  1. Supprime l'utilisateur avec l'email dropit.transport@gmail.com
  2. Nettoyage complet pour tests
*/

-- Créer une fonction pour supprimer l'utilisateur auth
CREATE OR REPLACE FUNCTION delete_auth_user_by_id(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Supprimer l'utilisateur DROP IT
DO $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT id INTO user_record FROM auth.users WHERE email = 'dropit.transport@gmail.com';
  
  IF FOUND THEN
    PERFORM delete_auth_user_by_id(user_record.id);
    RAISE NOTICE 'Utilisateur dropit.transport@gmail.com supprimé avec succès';
  ELSE
    RAISE NOTICE 'Aucun utilisateur trouvé avec cet email';
  END IF;
END $$;
