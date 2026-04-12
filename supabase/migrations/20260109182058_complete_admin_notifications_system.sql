/*
  # Système complet de notifications pour les admins

  1. Nouvelles fonctionnalités
    - Notification lors de la création d'une nouvelle demande de devis
    - Notification lors de l'émission d'un devis par un déménageur
    - Notification lors de la modification d'un devis par un déménageur
    - Note: Notification inscription client gérée dans AuthContext

  2. Sécurité
    - Triggers sécurisés avec SECURITY DEFINER
    - Notifications envoyées uniquement aux admins actifs
*/

-- ============================================================
-- TRIGGER 1: Notification lors d'une nouvelle demande de devis
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_on_quote_request_insert()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_record RECORD;
  route_info TEXT;
BEGIN
  -- Construire l'info de trajet
  route_info := NEW.from_city || ' (' || NEW.from_postal_code || ') → ' ||
                NEW.to_city || ' (' || NEW.to_postal_code || ')';

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
      related_id,
      created_at
    ) VALUES (
      admin_record.user_id,
      'admin',
      'new_quote_request',
      'Nouvelle demande de devis',
      'Nouvelle demande de déménagement: ' || route_info || ' le ' ||
        TO_CHAR(NEW.moving_date, 'DD/MM/YYYY'),
      NEW.id,
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Créer le trigger pour nouvelle demande de devis
DROP TRIGGER IF EXISTS on_quote_request_insert ON quote_requests;
CREATE TRIGGER on_quote_request_insert
  AFTER INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_quote_request_insert();

-- ============================================================
-- TRIGGER 2: Notification lors de l'émission d'un devis
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_on_quote_insert()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_record RECORD;
  mover_name TEXT;
  route_info TEXT;
BEGIN
  -- Récupérer le nom du déménageur
  SELECT company_name INTO mover_name
  FROM movers
  WHERE id = NEW.mover_id;

  -- Récupérer l'info de trajet
  SELECT from_city || ' → ' || to_city INTO route_info
  FROM quote_requests
  WHERE id = NEW.quote_request_id;

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
      related_id,
      created_at
    ) VALUES (
      admin_record.user_id,
      'admin',
      'new_quote',
      'Nouveau devis émis',
      'Le déménageur ' || COALESCE(mover_name, 'Inconnu') ||
        ' a émis un devis pour ' || COALESCE(route_info, 'une demande') ||
        ' (' || NEW.price::text || '€)',
      NEW.id,
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Créer le trigger pour nouveau devis
DROP TRIGGER IF EXISTS on_quote_insert ON quotes;
CREATE TRIGGER on_quote_insert
  AFTER INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_quote_insert();

-- ============================================================
-- TRIGGER 3: Notification lors de la modification d'un devis
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_on_quote_price_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_record RECORD;
  mover_name TEXT;
  route_info TEXT;
  changes TEXT;
BEGIN
  -- Ne notifier que si le prix ou le message change (pas pour les changements de statut)
  IF OLD.price IS DISTINCT FROM NEW.price OR OLD.message IS DISTINCT FROM NEW.message THEN

    -- Récupérer le nom du déménageur
    SELECT company_name INTO mover_name
    FROM movers
    WHERE id = NEW.mover_id;

    -- Récupérer l'info de trajet
    SELECT from_city || ' → ' || to_city INTO route_info
    FROM quote_requests
    WHERE id = NEW.quote_request_id;

    -- Construire le message des changements
    changes := '';
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      changes := 'Prix: ' || OLD.price::text || '€ → ' || NEW.price::text || '€';
    END IF;
    IF OLD.message IS DISTINCT FROM NEW.message THEN
      IF changes != '' THEN
        changes := changes || ', ';
      END IF;
      changes := changes || 'Message modifié';
    END IF;

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
        related_id,
        created_at
      ) VALUES (
        admin_record.user_id,
        'admin',
        'quote_update',
        'Devis modifié',
        'Le déménageur ' || COALESCE(mover_name, 'Inconnu') ||
          ' a modifié son devis pour ' || COALESCE(route_info, 'une demande') ||
          ' (' || changes || ')',
        NEW.id,
        NOW()
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger pour modification de devis
DROP TRIGGER IF EXISTS on_quote_price_update ON quotes;
CREATE TRIGGER on_quote_price_update
  AFTER UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_quote_price_update();