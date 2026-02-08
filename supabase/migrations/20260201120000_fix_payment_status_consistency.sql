/*
  # Fix Payment Status Consistency
  
  This migration fixes the mismatch between:
  1. The trigger that sets payment_status = 'completed' on quote_requests
  2. The UI that checks for 'deposit_paid' or 'fully_paid'
  
  Solution: Update the trigger to set 'deposit_paid' which correctly reflects
  that only the deposit (acompte) has been paid.
*/

-- First, update the constraint on quote_requests to ensure valid values
ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_payment_status_check;
ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_payment_status_check 
  CHECK (payment_status IN ('no_payment', 'deposit_paid', 'fully_paid', 'refunded'));

-- Recreate the trigger function with correct status value
CREATE OR REPLACE FUNCTION update_quote_status_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when payment status changes to 'completed'
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    -- Update the quote status to accepted
    UPDATE quotes SET status = 'accepted' WHERE id = NEW.quote_id;
    
    -- Update quote_request with 'deposit_paid' (NOT 'completed' which is not a valid value)
    UPDATE quote_requests 
    SET 
      accepted_quote_id = NEW.quote_id,
      payment_status = 'deposit_paid'  -- This is what the UI expects
    WHERE id = NEW.quote_request_id;
    
    -- Reject all other pending quotes for this request
    UPDATE quotes 
    SET status = 'rejected' 
    WHERE quote_request_id = NEW.quote_request_id 
      AND id != NEW.quote_id 
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_quote_status_after_payment ON payments;
CREATE TRIGGER trigger_update_quote_status_after_payment
  AFTER INSERT OR UPDATE OF payment_status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_status_after_payment();

-- Fix any existing records that have incorrect status
-- Change 'completed' to 'deposit_paid' in quote_requests
UPDATE quote_requests 
SET payment_status = 'deposit_paid' 
WHERE payment_status = 'completed';

-- Also fix any that might have 'fully_paid' set by the old trigger
-- (keeping 'fully_paid' if it was intentionally set that way is fine)

COMMENT ON FUNCTION update_quote_status_after_payment() IS 
  'Updates quote_requests.payment_status to deposit_paid when a payment is recorded. 
   This is triggered after a payment record is inserted with status completed.';
