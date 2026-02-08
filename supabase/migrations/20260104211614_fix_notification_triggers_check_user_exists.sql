/*
  # Fix Notification Triggers to Check User Existence

  1. Changes
    - Update all notification triggers to check if user_id exists in auth.users before creating notifications
    - This prevents foreign key constraint violations when user accounts don't exist
    
  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
    
  3. Notes
    - This fixes the error: "insert or update on table notifications violates foreign key constraint notifications_user_id_fkey"
    - The triggers will silently skip notification creation if the user doesn't exist
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_notify_mover_quote_accepted ON quote_requests;
DROP TRIGGER IF EXISTS trigger_notify_review_posted ON reviews;
DROP TRIGGER IF EXISTS trigger_notify_payment_completed ON payments;
DROP TRIGGER IF EXISTS trigger_notify_message_received ON messages;
DROP TRIGGER IF EXISTS trigger_notify_client_new_quote ON quotes;

-- Update function: Notify mover when their quote is accepted
CREATE OR REPLACE FUNCTION notify_mover_quote_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mover_user_id uuid;
  v_quote_id uuid;
  v_user_exists boolean;
BEGIN
  -- Only trigger when accepted_quote_id changes from NULL to a value
  IF NEW.accepted_quote_id IS NOT NULL AND (OLD.accepted_quote_id IS NULL OR OLD.accepted_quote_id != NEW.accepted_quote_id) THEN
    
    v_quote_id := NEW.accepted_quote_id;
    
    -- Get mover user_id from the accepted quote
    SELECT m.user_id INTO v_mover_user_id
    FROM quotes q
    JOIN movers m ON q.mover_id = m.id
    WHERE q.id = v_quote_id;
    
    -- Check if user exists in auth.users
    IF v_mover_user_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_mover_user_id) INTO v_user_exists;
      
      -- Only create notification if user exists
      IF v_user_exists THEN
        PERFORM create_notification(
          v_mover_user_id,
          'mover',
          'Devis accepté!',
          'Félicitations! Votre devis a été accepté par le client',
          'quote_accepted',
          v_quote_id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update function: Notify when review is posted
CREATE OR REPLACE FUNCTION notify_review_posted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mover_user_id uuid;
  v_user_exists boolean;
BEGIN
  -- Get mover user_id
  SELECT user_id INTO v_mover_user_id
  FROM movers
  WHERE id = NEW.mover_id;
  
  -- Check if user exists and notify mover
  IF v_mover_user_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_mover_user_id) INTO v_user_exists;
    
    IF v_user_exists THEN
      PERFORM create_notification(
        v_mover_user_id,
        'mover',
        'Nouvel avis reçu',
        format('Vous avez reçu un avis de %s étoiles', NEW.rating),
        'review',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update function: Notify when payment is completed
CREATE OR REPLACE FUNCTION notify_payment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mover_user_id uuid;
  v_client_exists boolean;
  v_mover_exists boolean;
BEGIN
  -- Only notify on successful payment
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    
    -- Check if client user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = NEW.client_id) INTO v_client_exists;
    
    -- Notify client if user exists
    IF v_client_exists THEN
      PERFORM create_notification(
        NEW.client_id,
        'client',
        'Paiement confirmé',
        format('Votre paiement de %s€ a été confirmé', NEW.total_amount),
        'payment',
        NEW.id
      );
    END IF;
    
    -- Get mover user_id
    SELECT user_id INTO v_mover_user_id
    FROM movers
    WHERE id = NEW.mover_id;
    
    -- Notify mover if user exists
    IF v_mover_user_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_mover_user_id) INTO v_mover_exists;
      
      IF v_mover_exists THEN
        PERFORM create_notification(
          v_mover_user_id,
          'mover',
          'Paiement reçu',
          format('Paiement de %s€ reçu (votre part: %s€)', NEW.total_amount, NEW.mover_deposit),
          'payment',
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update function: Notify when message is received
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_id uuid;
  v_recipient_type text;
  v_sender_name text;
  v_client_name text;
  v_mover_name text;
  v_user_exists boolean;
BEGIN
  -- Get client name
  SELECT CONCAT(first_name, ' ', last_name) INTO v_client_name
  FROM clients
  WHERE user_id = NEW.client_id;
  
  -- Get mover name
  SELECT company_name INTO v_mover_name
  FROM movers m
  WHERE m.user_id = NEW.mover_id;
  
  -- Determine recipient
  IF NEW.sender_type = 'client' THEN
    v_recipient_id := NEW.mover_id;
    v_recipient_type := 'mover';
    v_sender_name := v_client_name;
  ELSE
    v_recipient_id := NEW.client_id;
    v_recipient_type := 'client';
    v_sender_name := v_mover_name;
  END IF;
  
  -- Check if recipient exists and create notification
  IF v_recipient_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_recipient_id) INTO v_user_exists;
    
    IF v_user_exists THEN
      PERFORM create_notification(
        v_recipient_id,
        v_recipient_type,
        'Nouveau message',
        format('%s vous a envoyé un message', v_sender_name),
        'message',
        NEW.quote_request_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update function: Notify client when new quote is submitted
CREATE OR REPLACE FUNCTION notify_client_new_quote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_mover_name text;
  v_user_exists boolean;
BEGIN
  -- Get client_id from quote_request
  SELECT client_user_id INTO v_client_id
  FROM quote_requests
  WHERE id = NEW.quote_request_id;
  
  -- Get mover company name
  SELECT company_name INTO v_mover_name
  FROM movers
  WHERE id = NEW.mover_id;
  
  -- Check if client exists and create notification
  IF v_client_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_client_id) INTO v_user_exists;
    
    IF v_user_exists THEN
      PERFORM create_notification(
        v_client_id,
        'client',
        'Nouveau devis reçu',
        format('%s a soumis un devis de %s€', v_mover_name, NEW.client_display_price),
        'new_quote',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate all triggers
CREATE TRIGGER trigger_notify_client_new_quote
AFTER INSERT ON quotes
FOR EACH ROW
EXECUTE FUNCTION notify_client_new_quote();

CREATE TRIGGER trigger_notify_mover_quote_accepted
AFTER UPDATE ON quote_requests
FOR EACH ROW
EXECUTE FUNCTION notify_mover_quote_accepted();

CREATE TRIGGER trigger_notify_message_received
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_message_received();

CREATE TRIGGER trigger_notify_review_posted
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION notify_review_posted();

CREATE TRIGGER trigger_notify_payment_completed
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_completed();