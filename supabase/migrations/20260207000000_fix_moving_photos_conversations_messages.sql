-- ============================================================
-- Fix 1: moving_photos - Add missing photo_types and fix RLS
-- ============================================================

-- First, update the CHECK constraint to allow 'after' and 'damage' photo types
ALTER TABLE moving_photos DROP CONSTRAINT IF EXISTS moving_photos_photo_type_check;
ALTER TABLE moving_photos ADD CONSTRAINT moving_photos_photo_type_check 
  CHECK (photo_type IN ('before_departure', 'loading', 'unloading', 'before', 'after', 'damage'));

-- Drop existing INSERT policies that are too restrictive
DROP POLICY IF EXISTS "Clients can upload before_departure and unloading photos" ON moving_photos;
DROP POLICY IF EXISTS "Movers can upload loading photos" ON moving_photos;

-- Recreate client INSERT policy: allow all photo types for their requests
CREATE POLICY "Clients can upload photos for their requests"
  ON moving_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
  );

-- Recreate mover INSERT policy: allow all photo types for their accepted quotes
CREATE POLICY "Movers can upload photos for their accepted quotes"
  ON moving_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      -- Mover has an accepted quote for this request
      quote_request_id IN (
        SELECT qr.id FROM quote_requests qr
        JOIN quotes q ON q.quote_request_id = qr.id
        JOIN movers m ON q.mover_id = m.id
        WHERE m.user_id = auth.uid()
          AND (q.status = 'accepted' OR qr.accepted_quote_id = q.id)
      )
    )
  );


-- ============================================================
-- Fix 2: conversations - Handle duplicate key gracefully
-- The app code needs to handle this, but let's also ensure
-- movers can see conversations via their mover_id properly
-- ============================================================

-- Ensure mover SELECT policy also covers looking up by mover record id
DROP POLICY IF EXISTS "Movers can view own conversations" ON conversations;
CREATE POLICY "Movers can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = conversations.mover_id
      AND movers.user_id = auth.uid()
    )
  );


-- ============================================================
-- Fix 3: messages trigger - Fix notify_message_received to
-- look up client_id/mover_id from conversations table
-- ============================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_notify_message_received ON messages;

-- Recreate the function to properly look up from conversations
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
  v_recipient_type text;
  v_sender_name text;
  v_client_name text;
  v_mover_name text;
  v_mover_user_id uuid;
  v_user_exists boolean;
BEGIN
  -- Get conversation details (client_id, mover_id, quote_request_id)
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = NEW.conversation_id;

  IF v_conversation IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get client name
  BEGIN
    SELECT COALESCE(CONCAT(first_name, ' ', last_name), email) INTO v_client_name
    FROM clients
    WHERE user_id = v_conversation.client_id;
  EXCEPTION WHEN OTHERS THEN
    v_client_name := 'Un client';
  END;

  -- Get mover name and user_id
  BEGIN
    SELECT company_name, user_id INTO v_mover_name, v_mover_user_id
    FROM movers
    WHERE id = v_conversation.mover_id;
  EXCEPTION WHEN OTHERS THEN
    v_mover_name := 'Un déménageur';
  END;

  -- Determine recipient based on sender_type
  IF NEW.sender_type = 'client' THEN
    -- Client sent message -> notify mover
    v_recipient_id := v_mover_user_id;
    v_recipient_type := 'mover';
    v_sender_name := COALESCE(v_client_name, 'Un client');
  ELSE
    -- Mover sent message -> notify client
    v_recipient_id := v_conversation.client_id;
    v_recipient_type := 'client';
    v_sender_name := COALESCE(v_mover_name, 'Un déménageur');
  END IF;

  -- Check if recipient exists and create notification
  IF v_recipient_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_recipient_id) INTO v_user_exists;

    IF v_user_exists THEN
      INSERT INTO notifications (user_id, user_type, title, message, type, related_id)
      VALUES (
        v_recipient_id,
        v_recipient_type,
        'Nouveau message',
        format('%s vous a envoyé un message', v_sender_name),
        'message',
        v_conversation.quote_request_id::text
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't let notification errors block message sending
  RAISE WARNING 'notify_message_received error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_notify_message_received
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_message_received();
