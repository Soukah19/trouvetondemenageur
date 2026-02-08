/*
  # Correction des triggers de notification avec user_type
  
  1. Mise à jour
    - Ajout du champ user_type manquant dans les triggers
  
  2. Sécurité
    - Les triggers envoient des notifications aux admins avec le bon user_type
*/

-- Fonction pour notifier les admins lors d'une nouvelle inscription déménageur (mise à jour)
CREATE OR REPLACE FUNCTION notify_admins_new_mover()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_record RECORD;
  user_email TEXT;
BEGIN
  -- Récupérer l'email de l'utilisateur
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Notifier tous les admins
  FOR admin_record IN
    SELECT user_id FROM admins
  LOOP
    INSERT INTO notifications (
      user_id,
      user_type,
      type,
      title,
      message,
      created_at
    ) VALUES (
      admin_record.user_id,
      'admin',
      'mover_registration',
      'Nouveau déménageur inscrit',
      'Un nouveau déménageur s''est inscrit: ' || COALESCE(NEW.company_name, user_email, 'Nom non disponible'),
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;
