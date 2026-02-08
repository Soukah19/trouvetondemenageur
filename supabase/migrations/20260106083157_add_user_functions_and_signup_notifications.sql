/*
  # Ajout de fonctions pour compter les clients et notifications d'inscription
  
  1. Nouvelles fonctions
    - `get_all_users()` - Récupère tous les utilisateurs auth
    - `get_recent_users(days)` - Récupère les utilisateurs récents
  
  2. Notifications
    - Trigger pour notifier les admins lors de nouvelles inscriptions clients
    - Trigger pour notifier les admins lors de nouvelles inscriptions déménageurs
  
  3. Sécurité
    - Fonctions accessibles uniquement aux admins
*/

-- Fonction pour récupérer tous les utilisateurs
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Fonction pour récupérer les utilisateurs récents
CREATE OR REPLACE FUNCTION get_recent_users(days integer)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at
  FROM auth.users u
  WHERE u.created_at >= NOW() - (days || ' days')::interval
  ORDER BY u.created_at DESC;
END;
$$;

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
        type,
        title,
        message,
        created_at
      ) VALUES (
        admin_record.user_id,
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
      type,
      title,
      message,
      created_at
    ) VALUES (
      admin_record.user_id,
      'mover_registration',
      'Nouveau déménageur inscrit',
      'Un nouveau déménageur s''est inscrit: ' || COALESCE(NEW.company_name, user_email, 'Nom non disponible'),
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger pour les nouvelles inscriptions clients (dans auth.users)
-- Note: Ce trigger ne peut pas être directement créé sur auth.users
-- Il sera géré côté application lors de l'inscription

-- Trigger pour les nouvelles inscriptions déménageurs
DROP TRIGGER IF EXISTS on_mover_signup ON movers;
CREATE TRIGGER on_mover_signup
  AFTER INSERT ON movers
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_mover();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_users(integer) TO authenticated;
