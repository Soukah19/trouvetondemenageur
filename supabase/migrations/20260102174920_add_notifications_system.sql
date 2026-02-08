/*
  # Add Real-Time Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `user_type` (text, either 'client' or 'mover')
      - `title` (text, notification title)
      - `message` (text, notification content)
      - `type` (text, notification type: 'new_quote', 'message', 'status_change', 'review', 'payment')
      - `related_id` (uuid, nullable, reference to related entity)
      - `read` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for users to read their own notifications
    - Add policies for users to update their own notifications (mark as read)

  3. Triggers
    - Auto-create notifications when new quotes are submitted
    - Auto-create notifications when messages are sent
    - Auto-create notifications when quote status changes
    - Auto-create notifications when reviews are posted
    - Auto-create notifications when payments are made
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('client', 'mover', 'admin')),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('new_quote', 'quote_accepted', 'message', 'status_change', 'review', 'payment', 'damage_report')),
  related_id uuid,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_user_type text,
  p_title text,
  p_message text,
  p_type text,
  p_related_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, user_type, title, message, type, related_id)
  VALUES (p_user_id, p_user_type, p_title, p_message, p_type, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger: Notify client when new quote is submitted
CREATE OR REPLACE FUNCTION notify_client_new_quote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_mover_name text;
BEGIN
  -- Get client_id from quote_request
  SELECT client_user_id INTO v_client_id
  FROM quote_requests
  WHERE id = NEW.quote_request_id;
  
  -- Get mover company name
  SELECT company_name INTO v_mover_name
  FROM movers
  WHERE id = NEW.mover_id;
  
  -- Create notification
  PERFORM create_notification(
    v_client_id,
    'client',
    'Nouveau devis reçu',
    format('%s a soumis un devis de %s€', v_mover_name, NEW.client_display_price),
    'new_quote',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_client_new_quote
AFTER INSERT ON quotes
FOR EACH ROW
EXECUTE FUNCTION notify_client_new_quote();

-- Trigger: Notify mover when their quote is accepted
CREATE OR REPLACE FUNCTION notify_mover_quote_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mover_user_id uuid;
  v_quote_id uuid;
BEGIN
  -- Only trigger when accepted_quote_id changes from NULL to a value
  IF NEW.accepted_quote_id IS NOT NULL AND (OLD.accepted_quote_id IS NULL OR OLD.accepted_quote_id != NEW.accepted_quote_id) THEN
    
    v_quote_id := NEW.accepted_quote_id;
    
    -- Get mover user_id from the accepted quote
    SELECT m.user_id INTO v_mover_user_id
    FROM quotes q
    JOIN movers m ON q.mover_id = m.id
    WHERE q.id = v_quote_id;
    
    -- Create notification for mover
    IF v_mover_user_id IS NOT NULL THEN
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
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_mover_quote_accepted
AFTER UPDATE ON quote_requests
FOR EACH ROW
EXECUTE FUNCTION notify_mover_quote_accepted();

-- Trigger: Notify when message is received
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
  
  -- Create notification
  PERFORM create_notification(
    v_recipient_id,
    v_recipient_type,
    'Nouveau message',
    format('%s vous a envoyé un message', v_sender_name),
    'message',
    NEW.quote_request_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_message_received
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_message_received();

-- Trigger: Notify when review is posted
CREATE OR REPLACE FUNCTION notify_review_posted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mover_user_id uuid;
BEGIN
  -- Get mover user_id
  SELECT user_id INTO v_mover_user_id
  FROM movers
  WHERE id = NEW.mover_id;
  
  -- Notify mover
  PERFORM create_notification(
    v_mover_user_id,
    'mover',
    'Nouvel avis reçu',
    format('Vous avez reçu un avis de %s étoiles', NEW.rating),
    'review',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_review_posted
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION notify_review_posted();

-- Trigger: Notify when payment is completed
CREATE OR REPLACE FUNCTION notify_payment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mover_user_id uuid;
BEGIN
  -- Only notify on successful payment
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    
    -- Get mover user_id
    SELECT user_id INTO v_mover_user_id
    FROM movers
    WHERE id = NEW.mover_id;
    
    -- Notify client
    PERFORM create_notification(
      NEW.client_id,
      'client',
      'Paiement confirmé',
      format('Votre paiement de %s€ a été confirmé', NEW.total_amount),
      'payment',
      NEW.id
    );
    
    -- Notify mover
    IF v_mover_user_id IS NOT NULL THEN
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
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_payment_completed
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_completed();