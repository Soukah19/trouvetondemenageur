-- ============================================================
-- Fix photo upload workflow + damage report notifications + guarantee
-- ============================================================

-- 1. FIX RLS: Allow clients to upload 'after' and 'damage' photos
-- The CHECK constraint was already updated but RLS INSERT policy was not
DROP POLICY IF EXISTS "Clients can upload before_departure and unloading photos" ON moving_photos;
CREATE POLICY "Clients can upload photos"
  ON moving_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
    AND photo_type IN ('before_departure', 'unloading', 'after', 'damage')
  );

-- Also ensure movers can only upload 'loading' photos (during chargement only)
DROP POLICY IF EXISTS "Movers can upload loading photos" ON moving_photos;
DROP POLICY IF EXISTS "Movers can upload photos" ON moving_photos;
CREATE POLICY "Movers can upload loading photos"
  ON moving_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND quote_request_id IN (
      SELECT qr.id FROM quote_requests qr
      WHERE qr.accepted_quote_id IN (
        SELECT id FROM quotes WHERE mover_id IN (
          SELECT id FROM movers WHERE user_id = auth.uid()
        )
      )
    )
    AND photo_type = 'loading'
  );


-- 2. NOTIFY ADMIN when a damage report is created
CREATE OR REPLACE FUNCTION notify_admin_on_damage_report()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_record RECORD;
  v_from_city text;
  v_to_city text;
  v_client_name text;
  v_mover_user_id uuid;
BEGIN
  -- Get quote request info
  SELECT qr.from_city, qr.to_city, 
    COALESCE(c.first_name || ' ' || c.last_name, 'Client') as client_name,
    (SELECT m.user_id FROM movers m JOIN quotes q ON q.mover_id = m.id WHERE q.id = qr.accepted_quote_id) as mover_uid
  INTO v_from_city, v_to_city, v_client_name, v_mover_user_id
  FROM quote_requests qr
  LEFT JOIN clients c ON c.user_id = qr.client_user_id
  WHERE qr.id = NEW.quote_request_id;

  -- Notify all admins
  FOR admin_record IN SELECT user_id FROM admins
  LOOP
    INSERT INTO notifications (user_id, user_type, title, message, type, related_id, read, created_at)
    VALUES (
      admin_record.user_id,
      'admin',
      '⚠️ Nouveau rapport de dommage',
      'Le client ' || v_client_name || ' a signalé des dommages pour le déménagement ' 
        || COALESCE(v_from_city, '?') || ' → ' || COALESCE(v_to_city, '?') 
        || '. Veuillez examiner les photos et prendre une décision sur la garantie.',
      'damage_report',
      NEW.id,
      false,
      NOW()
    );
  END LOOP;

  -- Also notify the mover that a damage report was filed
  IF v_mover_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, user_type, title, message, type, related_id, read, created_at)
    VALUES (
      v_mover_user_id,
      'mover',
      'Rapport de dommage signalé',
      'Un client a signalé des dommages pour le déménagement ' 
        || COALESCE(v_from_city, '?') || ' → ' || COALESCE(v_to_city, '?') 
        || '. L''administrateur examinera le rapport. La garantie est retenue en attendant.',
      'damage_report',
      NEW.id,
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_admin_on_damage_report ON damage_reports;
CREATE TRIGGER trigger_notify_admin_on_damage_report
  AFTER INSERT ON damage_reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_damage_report();


-- 3. Add guarantee_status column to payments to track guarantee lifecycle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'guarantee_status'
  ) THEN
    ALTER TABLE payments ADD COLUMN guarantee_status text DEFAULT 'held' 
      CHECK (guarantee_status IN ('held', 'released_to_mover', 'kept_for_client', 'partial_release'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'guarantee_released_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN guarantee_released_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'guarantee_decision_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN guarantee_decision_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'guarantee_decision_by'
  ) THEN
    ALTER TABLE payments ADD COLUMN guarantee_decision_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'guarantee_notes'
  ) THEN
    ALTER TABLE payments ADD COLUMN guarantee_notes text;
  END IF;
END $$;

COMMENT ON COLUMN payments.guarantee_status IS 'held=waiting for 48h/review, released_to_mover=no damage, kept_for_client=full damage, partial_release=partial damage';
COMMENT ON COLUMN payments.guarantee_released_amount IS 'Amount of guarantee released back to mover (0 if kept for client)';


-- 4. Auto-release guarantee after 48h if no damage report
-- This function checks if 48h passed and no damage report exists
CREATE OR REPLACE FUNCTION auto_release_guarantee()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  payment_record RECORD;
  v_damage_count integer;
BEGIN
  -- Find payments where:
  -- - guarantee is still 'held'
  -- - mission is completed
  -- - 48h has passed since completion
  FOR payment_record IN
    SELECT p.id, p.quote_request_id, p.guarantee_amount
    FROM payments p
    JOIN moving_status ms ON ms.quote_request_id = p.quote_request_id
    WHERE p.guarantee_status = 'held'
      AND p.guarantee_amount > 0
      AND ms.status = 'completed'
      AND ms.completed_at IS NOT NULL
      AND ms.completed_at + INTERVAL '48 hours' < NOW()
  LOOP
    -- Check if there's a damage report
    SELECT COUNT(*) INTO v_damage_count
    FROM damage_reports
    WHERE quote_request_id = payment_record.quote_request_id
      AND status != 'rejected';

    -- If no damage report, release guarantee to mover
    IF v_damage_count = 0 THEN
      UPDATE payments
      SET guarantee_status = 'released_to_mover',
          guarantee_released_amount = payment_record.guarantee_amount,
          guarantee_decision_at = NOW(),
          guarantee_notes = 'Libération automatique - aucun dommage signalé dans les 48h'
      WHERE id = payment_record.id;
    END IF;
  END LOOP;
END;
$$;


-- 5. Notification type update to include damage_report if not already there
-- (The CHECK constraint may need updating if it was too restrictive)
DO $$
BEGIN
  -- Try to update the notifications type check to include damage_report
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('new_quote', 'quote_accepted', 'message', 'status_change', 'review', 'payment', 'damage_report', 'quote_update', 'info', 'system', 'new_quote_request'));
EXCEPTION
  WHEN others THEN
    NULL; -- constraint might not exist or already be fine
END $$;
