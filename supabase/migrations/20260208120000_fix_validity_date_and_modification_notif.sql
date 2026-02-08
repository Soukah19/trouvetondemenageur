-- ============================================================
-- Fix 10: Allow validity_date = moving_date (remove -1 day)
-- Fix 12: Notify movers when client or admin modifies a quote request
-- ============================================================

-- Fix 10: Update validity date validation
-- Old: max_validity_date = moving_date + flexibility - 1 day  (blocks same-day)
-- New: max_validity_date = moving_date + flexibility           (allows same-day)
CREATE OR REPLACE FUNCTION validate_quote_validity_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  max_validity_date date;
  moving_date_val date;
  flexibility_days_val integer;
BEGIN
  SELECT 
    moving_date, 
    COALESCE(date_flexibility_days, 0)
  INTO 
    moving_date_val, 
    flexibility_days_val
  FROM quote_requests
  WHERE id = NEW.quote_request_id;
  
  -- Max validity = moving_date + flexibility days (inclusive)
  max_validity_date := moving_date_val + (flexibility_days_val * INTERVAL '1 day');
  
  IF NEW.validity_date > max_validity_date::date THEN
    RAISE EXCEPTION 
      'La date de validité du devis (%) ne peut pas dépasser le % (date du déménagement % + flexibilité % jour(s))',
      NEW.validity_date,
      max_validity_date::date,
      moving_date_val,
      flexibility_days_val
    USING HINT = format('Date maximale autorisée: %s', max_validity_date::date);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix 12: Update the quote request modification notification trigger
-- When a quote request is modified (by client OR admin), notify movers who submitted quotes
-- and invalidate their old quotes so they must resubmit
CREATE OR REPLACE FUNCTION notify_on_quote_request_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  mover_record RECORD;
  v_from_city text;
  v_to_city text;
  content_changed boolean := false;
BEGIN
  -- Check if actual content fields changed (not just status/payment fields)
  IF (
    OLD.from_address IS DISTINCT FROM NEW.from_address OR
    OLD.from_city IS DISTINCT FROM NEW.from_city OR
    OLD.from_postal_code IS DISTINCT FROM NEW.from_postal_code OR
    OLD.to_address IS DISTINCT FROM NEW.to_address OR
    OLD.to_city IS DISTINCT FROM NEW.to_city OR
    OLD.to_postal_code IS DISTINCT FROM NEW.to_postal_code OR
    OLD.moving_date IS DISTINCT FROM NEW.moving_date OR
    OLD.volume_m3 IS DISTINCT FROM NEW.volume_m3 OR
    OLD.surface_m2 IS DISTINCT FROM NEW.surface_m2 OR
    OLD.floor_from IS DISTINCT FROM NEW.floor_from OR
    OLD.floor_to IS DISTINCT FROM NEW.floor_to OR
    OLD.elevator_from IS DISTINCT FROM NEW.elevator_from OR
    OLD.elevator_to IS DISTINCT FROM NEW.elevator_to OR
    OLD.services_needed IS DISTINCT FROM NEW.services_needed OR
    OLD.furniture_inventory IS DISTINCT FROM NEW.furniture_inventory OR
    OLD.furniture_lift_needed_departure IS DISTINCT FROM NEW.furniture_lift_needed_departure OR
    OLD.furniture_lift_needed_arrival IS DISTINCT FROM NEW.furniture_lift_needed_arrival OR
    OLD.date_flexibility_days IS DISTINCT FROM NEW.date_flexibility_days OR
    OLD.accepts_groupage IS DISTINCT FROM NEW.accepts_groupage OR
    OLD.from_home_type IS DISTINCT FROM NEW.from_home_type OR
    OLD.to_home_type IS DISTINCT FROM NEW.to_home_type OR
    OLD.from_home_size IS DISTINCT FROM NEW.from_home_size OR
    OLD.to_home_size IS DISTINCT FROM NEW.to_home_size
  ) THEN
    content_changed := true;
  END IF;

  -- Only proceed if actual content changed
  IF NOT content_changed THEN
    RETURN NEW;
  END IF;

  v_from_city := COALESCE(NEW.from_city, OLD.from_city);
  v_to_city := COALESCE(NEW.to_city, OLD.to_city);

  -- Notify all movers who have submitted quotes for this request
  -- and invalidate their quotes so they must resubmit
  FOR mover_record IN
    SELECT DISTINCT q.mover_id, m.user_id
    FROM quotes q
    JOIN movers m ON m.id = q.mover_id
    WHERE q.quote_request_id = NEW.id
      AND q.status IN ('pending', 'submitted')
  LOOP
    -- Mark old quotes as needing resubmission
    UPDATE quotes
    SET status = 'revision_needed'
    WHERE quote_request_id = NEW.id
      AND mover_id = mover_record.mover_id
      AND status IN ('pending', 'submitted');

    -- Notify the mover
    INSERT INTO notifications (user_id, user_type, title, message, type, related_id, read, created_at)
    VALUES (
      mover_record.user_id,
      'mover',
      '📝 Demande modifiée - nouveau devis requis',
      'La demande de déménagement ' || v_from_city || ' → ' || v_to_city 
        || ' a été modifiée. Votre ancien devis n''est plus valide. Veuillez soumettre un nouveau devis adapté.',
      'quote_update',
      NEW.id,
      false,
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS trigger_notify_on_quote_request_update ON quote_requests;
CREATE TRIGGER trigger_notify_on_quote_request_update
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_quote_request_update();

-- Add 'revision_needed' to quotes status if not already there
DO $$
BEGIN
  ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
  ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
    CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'expired', 'revision_needed'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Also ensure quote_update is an allowed notification type
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('new_quote', 'quote_accepted', 'message', 'status_change', 'review', 'payment', 'damage_report', 'quote_update', 'info', 'system', 'new_quote_request', 'damage_alert'));
EXCEPTION
  WHEN others THEN NULL;
END $$;
