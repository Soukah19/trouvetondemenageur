/*
  # Fix notification trigger to not fire on quote acceptance

  1. Problem
    - When a client accepts a devis, the quote_requests table is updated (status -> 'accepted')
    - This currently triggers a "demande modifiée" notification to movers
    - This is confusing because accepting a quote is NOT the same as modifying the request

  2. Solution
    - Update the trigger to check if the change is a real content modification
    - Skip notification if only status, payment_status, or accepted_quote_id changed
    - Only notify when actual request details like address, date, volume, etc. change
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS notify_on_quote_request_update_trigger ON quote_requests;

-- Create improved function that only notifies on real content changes
CREATE OR REPLACE FUNCTION notify_on_quote_request_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  mover_record RECORD;
  admin_record RECORD;
  is_content_changed BOOLEAN := false;
BEGIN
  -- Only process UPDATEs
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Check if actual content changed (not just status/payment fields)
  -- We consider it a content change if any of these fields changed:
  -- addresses, cities, date, home info, volume, services, etc.
  IF (
    OLD.from_address IS DISTINCT FROM NEW.from_address OR
    OLD.from_city IS DISTINCT FROM NEW.from_city OR
    OLD.from_postal_code IS DISTINCT FROM NEW.from_postal_code OR
    OLD.to_address IS DISTINCT FROM NEW.to_address OR
    OLD.to_city IS DISTINCT FROM NEW.to_city OR
    OLD.to_postal_code IS DISTINCT FROM NEW.to_postal_code OR
    OLD.moving_date IS DISTINCT FROM NEW.moving_date OR
    OLD.home_size IS DISTINCT FROM NEW.home_size OR
    OLD.home_type IS DISTINCT FROM NEW.home_type OR
    OLD.floor_from IS DISTINCT FROM NEW.floor_from OR
    OLD.floor_to IS DISTINCT FROM NEW.floor_to OR
    OLD.elevator_from IS DISTINCT FROM NEW.elevator_from OR
    OLD.elevator_to IS DISTINCT FROM NEW.elevator_to OR
    OLD.volume_m3 IS DISTINCT FROM NEW.volume_m3 OR
    OLD.surface_m2 IS DISTINCT FROM NEW.surface_m2 OR
    OLD.services_needed IS DISTINCT FROM NEW.services_needed OR
    OLD.additional_info IS DISTINCT FROM NEW.additional_info OR
    OLD.date_flexibility_days IS DISTINCT FROM NEW.date_flexibility_days OR
    OLD.furniture_lift_needed_departure IS DISTINCT FROM NEW.furniture_lift_needed_departure OR
    OLD.furniture_lift_needed_arrival IS DISTINCT FROM NEW.furniture_lift_needed_arrival
  ) THEN
    is_content_changed := true;
  END IF;

  -- Only proceed if content actually changed
  -- Skip if only status, payment_status, or accepted_quote_id changed
  IF NOT is_content_changed THEN
    RETURN NEW;
  END IF;

  -- Notifier les déménageurs ayant soumis un devis
  FOR mover_record IN 
    SELECT DISTINCT m.user_id, m.company_name, m.email
    FROM quotes q
    JOIN movers m ON q.mover_id = m.id
    WHERE q.quote_request_id = NEW.id
      AND q.status = 'pending' -- Only notify movers with pending quotes
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
      'La demande ' || NEW.from_city || ' → ' || NEW.to_city || ' a été modifiée par le client.',
      'quote_update',
      false,
      NOW()
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER notify_on_quote_request_update_trigger
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_quote_request_update();

-- Add comment
COMMENT ON FUNCTION notify_on_quote_request_update() IS 
'Sends notifications when quote request content is modified. Does NOT fire on status/payment changes.';
