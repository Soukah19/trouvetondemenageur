/*
  # Fix Mover Welcome Email Trigger
  
  ## Problem
  The `queue_mover_welcome_email` trigger function references `OLD.is_verified` and `NEW.is_verified`
  but the `movers` table does NOT have an `is_verified` column. This causes a 400 error
  when trying to approve or reject movers:
  "record \"old\" has no field \"is_verified\""

  ## Solution
  Replace the trigger to use `verification_status` instead, which is the actual column
  on the movers table. The trigger should fire when verification_status changes from
  'pending' to 'verified'.
*/

-- Drop the broken trigger first
DROP TRIGGER IF EXISTS on_mover_validated ON movers;

-- Recreate the function using verification_status instead of is_verified
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

    -- Queue the welcome email
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

    -- Also create a notification for the mover
    INSERT INTO notifications (user_id, type, title, message, created_at)
    VALUES (
      NEW.user_id,
      'account_validated',
      'Votre compte a été validé ! 🎉',
      'Félicitations ! Votre compte déménageur a été vérifié et validé. Vous pouvez maintenant recevoir des demandes de devis.',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_mover_validated
  AFTER UPDATE ON movers
  FOR EACH ROW
  EXECUTE FUNCTION queue_mover_welcome_email();
