-- =====================================================
-- MIGRATION: Add Stripe refund + mover payout columns
-- Run this in Supabase SQL Editor BEFORE testing
-- =====================================================

-- 1. Add stripe_refund_id to refunds table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refunds' AND column_name = 'stripe_refund_id'
  ) THEN
    ALTER TABLE refunds ADD COLUMN stripe_refund_id text;
  END IF;
END $$;

-- 2. Add mover payout tracking columns to payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mover_payout_status'
  ) THEN
    ALTER TABLE payments ADD COLUMN mover_payout_status text DEFAULT 'pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mover_payout_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN mover_payout_date timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mover_payout_reference'
  ) THEN
    ALTER TABLE payments ADD COLUMN mover_payout_reference text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mover_payout_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN mover_payout_amount numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mover_payout_method'
  ) THEN
    ALTER TABLE payments ADD COLUMN mover_payout_method text;
  END IF;
END $$;

-- 3. Add stripe_account_id to movers (for future Stripe Connect)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE movers ADD COLUMN stripe_account_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'stripe_onboarding_complete'
  ) THEN
    ALTER TABLE movers ADD COLUMN stripe_onboarding_complete boolean DEFAULT false;
  END IF;
END $$;

-- 4. Add stripe_error column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'stripe_error'
  ) THEN
    ALTER TABLE payments ADD COLUMN stripe_error text;
  END IF;
END $$;

-- 5. Add useful comments
COMMENT ON COLUMN payments.mover_payout_status IS 'Statut du virement: pending, ready_to_pay, paid, failed';
COMMENT ON COLUMN payments.mover_payout_method IS 'Méthode: stripe_connect ou manual_sepa';
COMMENT ON COLUMN refunds.stripe_refund_id IS 'ID du remboursement Stripe (re_...)';

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_mover_payout_status ON payments(mover_payout_status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id ON payments(stripe_payment_id);
