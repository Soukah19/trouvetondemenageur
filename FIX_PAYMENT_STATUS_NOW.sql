-- ============================================
-- QUICK FIX: Payment Status Mismatch
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix the trigger to use 'deposit_paid' instead of 'completed'
CREATE OR REPLACE FUNCTION update_quote_status_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    -- Update quote to accepted
    UPDATE quotes SET status = 'accepted' WHERE id = NEW.quote_id;
    
    -- Update quote_request with 'deposit_paid' (this is what the UI expects!)
    UPDATE quote_requests 
    SET 
      accepted_quote_id = NEW.quote_id,
      payment_status = 'deposit_paid'
    WHERE id = NEW.quote_request_id;
    
    -- Reject other pending quotes
    UPDATE quotes 
    SET status = 'rejected' 
    WHERE quote_request_id = NEW.quote_request_id 
      AND id != NEW.quote_id 
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix any existing records that have wrong status
UPDATE quote_requests 
SET payment_status = 'deposit_paid' 
WHERE payment_status = 'completed';

-- 3. Also fix records where quote is accepted but payment_status is still wrong
UPDATE quote_requests qr
SET payment_status = 'deposit_paid'
WHERE EXISTS (
  SELECT 1 FROM quotes q 
  WHERE q.quote_request_id = qr.id 
  AND q.status = 'accepted'
)
AND qr.payment_status NOT IN ('deposit_paid', 'fully_paid');

-- Done! The messaging should now be unlocked for paid quotes.
SELECT 'Fix applied successfully!' as result;
