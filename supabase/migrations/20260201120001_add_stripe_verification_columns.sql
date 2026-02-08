/*
  # Add Stripe Verification Columns to Payments Table
  
  This migration adds columns needed to track Stripe webhook verification
  and handle payment failures/refunds properly.
*/

-- Add verification columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_verified boolean DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_verified_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_error text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount numeric(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- Update the payment_status constraint to include 'failed'
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_status_check 
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'deposit_released', 'released_to_mover', 'refunded_full', 'refunded_partial'));

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id ON payments(stripe_payment_id);

COMMENT ON COLUMN payments.stripe_verified IS 'True if payment was verified by Stripe webhook';
COMMENT ON COLUMN payments.stripe_verified_at IS 'Timestamp when Stripe webhook confirmed the payment';
COMMENT ON COLUMN payments.stripe_error IS 'Error message from Stripe if payment failed';
