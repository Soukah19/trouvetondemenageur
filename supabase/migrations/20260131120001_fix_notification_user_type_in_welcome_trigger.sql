/*
  # Fix Missing user_type in Welcome Email Notification Trigger

  ## Problem
  The `queue_mover_welcome_email` trigger function inserts into the `notifications` table
  but is missing the `user_type` field which is required (NOT NULL constraint).
  
  Error: "null value in column \"user_type\" of relation \"notifications\" violates not-null constraint"

  ## Solution
  Update the trigger function to include `user_type: 'mover'` in the notification insert.
*/

-- Drop and recreate the function with the user_type field
CREATE OR REPLACE FUNCTION queue_mover_welcome_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Only trigger when verification_status changes to 'verified'
  IF (OLD.verification_status IS DISTINCT FROM 'verified') AND NEW.verification_status = 'verified' THEN
    -- Get user email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;

    -- Queue the welcome email (if notification_queue table exists)
    BEGIN
      INSERT INTO notification_queue (type, recipient_email, recipient_name, data)
      VALUES (
        'mover_account_validated',
        COALESCE(user_email, NEW.email),
        NEW.company_name,
        jsonb_build_object(
          'company_name', NEW.company_name,
          'mover_id', NEW.id,
          'user_id', NEW.user_id
        )
      );
    EXCEPTION WHEN undefined_table THEN
      -- notification_queue table doesn't exist, skip
      NULL;
    END;

    -- Create a notification for the mover WITH user_type field
    INSERT INTO notifications (user_id, user_type, type, title, message, created_at)
    VALUES (
      NEW.user_id,
      'mover',  -- THIS WAS MISSING!
      'system',  -- Use 'system' type which is already allowed
      'Votre compte a été validé ! 🎉',
      'Félicitations ! Votre compte déménageur a été vérifié et validé. Vous pouvez maintenant recevoir des demandes de devis.',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;
