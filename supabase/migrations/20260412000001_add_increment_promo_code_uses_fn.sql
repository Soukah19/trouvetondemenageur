-- Helper RPC used by the create-payment-intent Edge Function
-- to atomically increment promo_codes.current_uses

CREATE OR REPLACE FUNCTION increment_promo_code_uses(p_promo_code_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1,
      updated_at   = now()
  WHERE id = p_promo_code_id;
END;
$$;
