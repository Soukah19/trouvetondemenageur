/*
  # Correction du trigger de notifications - Ajout du champ user_type
  
  1. Correctif
    - Ajout du champ user_type requis dans les notifications
    - user_type = 'mover' pour les déménageurs
    - user_type = 'admin' pour les admins
*/

-- Fonction corrigée pour créer les notifications avec user_type
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
  IF TG_OP = 'UPDATE' AND OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    
    FOR mover_record IN 
      SELECT DISTINCT m.user_id, m.company_name, m.email
      FROM quotes q
      JOIN movers m ON q.mover_id = m.id
      WHERE q.quote_request_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, user_type, title, message, type, read, created_at)
      VALUES (
        mover_record.user_id,
        'mover',
        'Demande de déménagement modifiée',
        'La demande de déménagement ' || NEW.from_city || ' → ' || NEW.to_city || ' a été modifiée. Veuillez vérifier et ajuster votre devis si nécessaire.',
        'quote_update',
        false,
        NOW()
      );
    END LOOP;
    
    FOR admin_record IN 
      SELECT user_id, username, email
      FROM admins
    LOOP
      INSERT INTO notifications (user_id, user_type, title, message, type, read, created_at)
      VALUES (
        admin_record.user_id,
        'admin',
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
