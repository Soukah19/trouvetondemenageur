-- Migration: Add Stripe fee tracking to payments
-- This stores the REAL Stripe fee from the balance transaction
-- so refunds can deduct the exact fee instead of estimating.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'stripe_fee'
  ) THEN
    ALTER TABLE payments ADD COLUMN stripe_fee NUMERIC DEFAULT 0;
    COMMENT ON COLUMN payments.stripe_fee IS 'Actual Stripe processing fee in EUR, retrieved from balance_transaction';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'stripe_card_country'
  ) THEN
    ALTER TABLE payments ADD COLUMN stripe_card_country TEXT DEFAULT '';
    COMMENT ON COLUMN payments.stripe_card_country IS 'Country of the card used (e.g. FR, US, GB)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'stripe_card_brand'
  ) THEN
    ALTER TABLE payments ADD COLUMN stripe_card_brand TEXT DEFAULT '';
    COMMENT ON COLUMN payments.stripe_card_brand IS 'Card brand (visa, mastercard, amex, etc.)';
  END IF;
END $$;