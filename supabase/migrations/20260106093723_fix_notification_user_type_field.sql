/*
  # Correction du champ user_type dans les notifications
  
  1. Modifications
    - Mise à jour de notify_admins_new_client() pour inclure user_type
    - Mise à jour de notify_admins_new_mover() pour inclure user_type
  
  2. Objectif
    - Les notifications d'inscription doivent inclure le champ user_type obligatoire
    - Les notifications sont envoyées UNIQUEMENT aux admins
*/

-- Fonction pour notifier les admins lors d'une nouvelle inscription client
CREATE OR REPLACE FUNCTION notify_admins_new_client()
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
  WHERE id = NEW.id;

  -- Vérifier que ce n'est pas un admin ou un déménageur
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = NEW.id) AND
     NOT EXISTS (SELECT 1 FROM movers WHERE user_id = NEW.id) THEN
    
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
        'system',
        'Nouvelle inscription client',
        'Un nouveau client s''est inscrit: ' || COALESCE(user_email, 'Email non disponible'),
        NOW()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Fonction pour notifier les admins lors d'une nouvelle inscription déménageur
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
