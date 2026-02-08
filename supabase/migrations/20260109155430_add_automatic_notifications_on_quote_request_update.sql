/*
  # Système de notifications automatiques lors de modification de demandes
  
  1. Fonctionnalité
    - Créer automatiquement des notifications quand une demande est modifiée
    - Notifier tous les déménageurs ayant soumis un devis
    - Notifier tous les admins
    - Garantit que les notifications sont TOUJOURS créées (même si le frontend échoue)
  
  2. Sécurité
    - Utilise un trigger database pour fiabilité maximale
    - Fonctionne indépendamment du code frontend
*/

-- Fonction pour créer les notifications lors de modification d'une demande
CREATE OR REPLACE FUNCTION notify_on_quote_request_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  mover_record RECORD;
  admin_record RECORD;
BEGIN
  -- Vérifier si c'est une vraie mise à jour (pas juste un insert)
  IF TG_OP = 'UPDATE' AND OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    
    -- Notifier les déménageurs ayant soumis un devis
    FOR mover_record IN 
      SELECT DISTINCT m.user_id, m.company_name, m.email
      FROM quotes q
      JOIN movers m ON q.mover_id = m.id
      WHERE q.quote_request_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, read, created_at)
      VALUES (
        mover_record.user_id,
        'Demande de déménagement modifiée',
        'La demande de déménagement ' || NEW.from_city || ' → ' || NEW.to_city || ' a été modifiée. Veuillez vérifier et ajuster votre devis si nécessaire.',
        'quote_update',
        false,
        NOW()
      );
    END LOOP;
    
    -- Notifier tous les admins
    FOR admin_record IN 
      SELECT user_id, username, email
      FROM admins
    LOOP
      INSERT INTO notifications (user_id, title, message, type, read, created_at)
      VALUES (
        admin_record.user_id,
        'Demande de déménagement modifiée',
        'La demande ' || NEW.from_city || ' → ' || NEW.to_city || ' a été modifiée.',
        'quote_update',
        false,
        NOW()
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS notify_on_quote_request_update_trigger ON quote_requests;
CREATE TRIGGER notify_on_quote_request_update_trigger
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_quote_request_update();
