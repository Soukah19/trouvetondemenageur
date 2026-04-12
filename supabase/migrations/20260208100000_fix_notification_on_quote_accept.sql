-- ============================================================
-- Fix: Don't send "demande modifiée" notification when client
-- accepts a quote (status/payment_status/accepted_quote_id changes)
-- Only notify movers when actual quote request CONTENT changes.
-- ============================================================

CREATE OR REPLACE FUNCTION notify_on_quote_request_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  mover_record RECORD;
  admin_record RECORD;
  changed_fields jsonb := '{}'::jsonb;
  has_content_changes boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    
    -- Skip notification if ONLY status-related fields changed
    -- (this happens when client accepts a quote / pays)
    IF (
      OLD.status IS DISTINCT FROM NEW.status
      OR OLD.payment_status IS DISTINCT FROM NEW.payment_status
      OR OLD.accepted_quote_id IS DISTINCT FROM NEW.accepted_quote_id
    ) THEN
      -- Check if ANY content field also changed
      -- If only status fields changed, don't send "demande modifiée"
      IF OLD.from_address IS NOT DISTINCT FROM NEW.from_address
        AND OLD.from_city IS NOT DISTINCT FROM NEW.from_city
        AND OLD.from_postal_code IS NOT DISTINCT FROM NEW.from_postal_code
        AND OLD.to_address IS NOT DISTINCT FROM NEW.to_address
        AND OLD.to_city IS NOT DISTINCT FROM NEW.to_city
        AND OLD.to_postal_code IS NOT DISTINCT FROM NEW.to_postal_code
        AND OLD.moving_date IS NOT DISTINCT FROM NEW.moving_date
        AND OLD.home_size IS NOT DISTINCT FROM NEW.home_size
        AND OLD.home_type IS NOT DISTINCT FROM NEW.home_type
        AND OLD.volume_m3 IS NOT DISTINCT FROM NEW.volume_m3
        AND OLD.from_surface_m2 IS NOT DISTINCT FROM NEW.from_surface_m2
        AND OLD.to_surface_m2 IS NOT DISTINCT FROM NEW.to_surface_m2
        AND OLD.floor_from IS NOT DISTINCT FROM NEW.floor_from
        AND OLD.floor_to IS NOT DISTINCT FROM NEW.floor_to
        AND OLD.elevator_from IS NOT DISTINCT FROM NEW.elevator_from
        AND OLD.elevator_to IS NOT DISTINCT FROM NEW.elevator_to
        AND OLD.services_needed::text IS NOT DISTINCT FROM NEW.services_needed::text
        AND OLD.furniture_lift_needed_departure IS NOT DISTINCT FROM NEW.furniture_lift_needed_departure
        AND OLD.furniture_lift_needed_arrival IS NOT DISTINCT FROM NEW.furniture_lift_needed_arrival
      THEN
        -- Only status/payment fields changed, skip notification
        RETURN NEW;
      END IF;
    END IF;
    
    -- Build changed fields object for actual content changes
    IF OLD.from_address IS DISTINCT FROM NEW.from_address THEN
      changed_fields := changed_fields || jsonb_build_object('from_address', jsonb_build_object('old', OLD.from_address, 'new', NEW.from_address));
    END IF;
    IF OLD.from_city IS DISTINCT FROM NEW.from_city THEN
      changed_fields := changed_fields || jsonb_build_object('from_city', jsonb_build_object('old', OLD.from_city, 'new', NEW.from_city));
    END IF;
    IF OLD.from_postal_code IS DISTINCT FROM NEW.from_postal_code THEN
      changed_fields := changed_fields || jsonb_build_object('from_postal_code', jsonb_build_object('old', OLD.from_postal_code, 'new', NEW.from_postal_code));
    END IF;
    IF OLD.to_address IS DISTINCT FROM NEW.to_address THEN
      changed_fields := changed_fields || jsonb_build_object('to_address', jsonb_build_object('old', OLD.to_address, 'new', NEW.to_address));
    END IF;
    IF OLD.to_city IS DISTINCT FROM NEW.to_city THEN
      changed_fields := changed_fields || jsonb_build_object('to_city', jsonb_build_object('old', OLD.to_city, 'new', NEW.to_city));
    END IF;
    IF OLD.to_postal_code IS DISTINCT FROM NEW.to_postal_code THEN
      changed_fields := changed_fields || jsonb_build_object('to_postal_code', jsonb_build_object('old', OLD.to_postal_code, 'new', NEW.to_postal_code));
    END IF;
    IF OLD.moving_date IS DISTINCT FROM NEW.moving_date THEN
      changed_fields := changed_fields || jsonb_build_object('moving_date', jsonb_build_object('old', OLD.moving_date, 'new', NEW.moving_date));
    END IF;
    IF OLD.home_size IS DISTINCT FROM NEW.home_size THEN
      changed_fields := changed_fields || jsonb_build_object('home_size', jsonb_build_object('old', OLD.home_size, 'new', NEW.home_size));
    END IF;
    IF OLD.home_type IS DISTINCT FROM NEW.home_type THEN
      changed_fields := changed_fields || jsonb_build_object('home_type', jsonb_build_object('old', OLD.home_type, 'new', NEW.home_type));
    END IF;
    IF OLD.volume_m3 IS DISTINCT FROM NEW.volume_m3 THEN
      changed_fields := changed_fields || jsonb_build_object('volume_m3', jsonb_build_object('old', OLD.volume_m3, 'new', NEW.volume_m3));
    END IF;
    IF OLD.from_surface_m2 IS DISTINCT FROM NEW.from_surface_m2 THEN
      changed_fields := changed_fields || jsonb_build_object('from_surface_m2', jsonb_build_object('old', OLD.from_surface_m2, 'new', NEW.from_surface_m2));
    END IF;
    IF OLD.to_surface_m2 IS DISTINCT FROM NEW.to_surface_m2 THEN
      changed_fields := changed_fields || jsonb_build_object('to_surface_m2', jsonb_build_object('old', OLD.to_surface_m2, 'new', NEW.to_surface_m2));
    END IF;
    IF OLD.floor_from IS DISTINCT FROM NEW.floor_from THEN
      changed_fields := changed_fields || jsonb_build_object('floor_from', jsonb_build_object('old', OLD.floor_from, 'new', NEW.floor_from));
    END IF;
    IF OLD.floor_to IS DISTINCT FROM NEW.floor_to THEN
      changed_fields := changed_fields || jsonb_build_object('floor_to', jsonb_build_object('old', OLD.floor_to, 'new', NEW.floor_to));
    END IF;
    IF OLD.elevator_from IS DISTINCT FROM NEW.elevator_from THEN
      changed_fields := changed_fields || jsonb_build_object('elevator_from', jsonb_build_object('old', OLD.elevator_from, 'new', NEW.elevator_from));
    END IF;
    IF OLD.elevator_to IS DISTINCT FROM NEW.elevator_to THEN
      changed_fields := changed_fields || jsonb_build_object('elevator_to', jsonb_build_object('old', OLD.elevator_to, 'new', NEW.elevator_to));
    END IF;
    IF OLD.services_needed::text IS DISTINCT FROM NEW.services_needed::text THEN
      changed_fields := changed_fields || jsonb_build_object('services_needed', jsonb_build_object('old', OLD.services_needed, 'new', NEW.services_needed));
    END IF;
    IF OLD.furniture_lift_needed_departure IS DISTINCT FROM NEW.furniture_lift_needed_departure THEN
      changed_fields := changed_fields || jsonb_build_object('furniture_lift_needed_departure', jsonb_build_object('old', OLD.furniture_lift_needed_departure, 'new', NEW.furniture_lift_needed_departure));
    END IF;
    IF OLD.furniture_lift_needed_arrival IS DISTINCT FROM NEW.furniture_lift_needed_arrival THEN
      changed_fields := changed_fields || jsonb_build_object('furniture_lift_needed_arrival', jsonb_build_object('old', OLD.furniture_lift_needed_arrival, 'new', NEW.furniture_lift_needed_arrival));
    END IF;
    
    -- Only proceed if there were actual content changes
    IF changed_fields = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
    
    -- Store changes in history table
    INSERT INTO quote_request_changes (quote_request_id, changed_fields, changed_at)
    VALUES (NEW.id, changed_fields, NOW());
    
    -- Notify movers who submitted a quote
    FOR mover_record IN 
      SELECT DISTINCT m.user_id, m.company_name, m.email
      FROM quotes q
      JOIN movers m ON q.mover_id = m.id
      WHERE q.quote_request_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, user_type, title, message, type, related_id, read, created_at)
      VALUES (
        mover_record.user_id,
        'mover',
        'Demande de déménagement modifiée',
        'La demande de déménagement ' || NEW.from_city || ' → ' || NEW.to_city || ' a été modifiée. Veuillez vérifier et ajuster votre devis si nécessaire.',
        'quote_update',
        NEW.id,
        false,
        NOW()
      );
    END LOOP;
    
    -- Notify all admins
    FOR admin_record IN 
      SELECT user_id, username, email
      FROM admins
    LOOP
      INSERT INTO notifications (user_id, user_type, title, message, type, related_id, read, created_at)
      VALUES (
        admin_record.user_id,
        'admin',
        'Demande de déménagement modifiée',
        'La demande ' || NEW.from_city || ' → ' || NEW.to_city || ' a été modifiée.',
        'quote_update',
        NEW.id,
        false,
        NOW()
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;
