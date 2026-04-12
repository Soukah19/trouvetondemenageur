-- ============================================================
-- Migration: Promo Codes System
-- ============================================================

-- 1. promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT UNIQUE NOT NULL,
  discount_type       TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value      NUMERIC NOT NULL CHECK (discount_value > 0),
  valid_from          TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until         TIMESTAMPTZ,
  max_uses            INTEGER,
  current_uses        INTEGER NOT NULL DEFAULT 0,
  min_amount          NUMERIC,
  max_discount_amount NUMERIC,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  description         TEXT,
  created_by          UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Normalise code to uppercase on insert/update
CREATE OR REPLACE FUNCTION promo_codes_uppercase_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code = UPPER(TRIM(NEW.code));
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_promo_codes_uppercase
  BEFORE INSERT OR UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION promo_codes_uppercase_code();

-- 2. promo_code_usage table
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id    UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id         UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  discount_amount  NUMERIC NOT NULL,
  original_amount  NUMERIC NOT NULL,
  final_amount     NUMERIC NOT NULL,
  used_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, user_id, quote_id)
);

-- Prevent the same user from using the same code twice (across quotes)
CREATE UNIQUE INDEX IF NOT EXISTS uix_promo_usage_user_code
  ON promo_code_usage (promo_code_id, user_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE promo_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- promo_codes: super_admin full access
CREATE POLICY "super_admin_all_promo_codes"
  ON promo_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
        AND admins.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
        AND admins.role = 'super_admin'
    )
  );

-- promo_codes: any authenticated client can SELECT (to validate)
CREATE POLICY "clients_read_active_promo_codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (true);

-- promo_code_usage: service_role only can INSERT
CREATE POLICY "service_role_insert_promo_usage"
  ON promo_code_usage FOR INSERT
  TO service_role
  WITH CHECK (true);

-- promo_code_usage: super_admin can SELECT
CREATE POLICY "super_admin_read_promo_usage"
  ON promo_code_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
        AND admins.role = 'super_admin'
    )
  );

-- promo_code_usage: a user can see their own usage
CREATE POLICY "user_read_own_promo_usage"
  ON promo_code_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
