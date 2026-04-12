-- Add single_use_per_user column to promo_codes
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS single_use_per_user BOOLEAN NOT NULL DEFAULT true;

-- Drop the hard unique index that was always enforcing single-use
DROP INDEX IF EXISTS uix_promo_usage_user_code;
