/*
  # Correction complète du système de paiement - v4

  ## Nouveau système de calcul
  - Client paie 40% du prix affiché (prix déménageur + 30%)
  - Commission plateforme: 30% du prix déménageur
  - Déménageur reçoit en 2 versements de 50% chacun

  ## Exemple
  - Devis déménageur: 1000€
  - Prix client: 1300€ (1000€ + 30%)
  - Acompte: 520€ (40% de 1300€)
  - Commission: 300€ (30% de 1000€)
  - Déménageur: 220€ (520€ - 300€)
    * 110€ avant (48h avant)
    * 110€ après (via système fin de mission)
*/

-- Supprimer les anciens triggers et fonctions
DROP TRIGGER IF EXISTS trigger_create_accepted_move ON payments;
DROP TRIGGER IF EXISTS trigger_create_accepted_move_on_payment ON payments;
DROP FUNCTION IF EXISTS create_accepted_move_on_payment() CASCADE;

-- Ajouter les nouveaux champs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'escrow_amount') THEN
    ALTER TABLE payments ADD COLUMN escrow_amount numeric DEFAULT 0 CHECK (escrow_amount >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'mover_price') THEN
    ALTER TABLE payments ADD COLUMN mover_price numeric DEFAULT 0 CHECK (mover_price >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'deposit_paid_at') THEN
    ALTER TABLE payments ADD COLUMN deposit_paid_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'escrow_released_at') THEN
    ALTER TABLE payments ADD COLUMN escrow_released_at timestamptz;
  END IF;
END $$;

-- Mettre à jour les contraintes
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_status_check 
  CHECK (payment_status IN ('pending', 'completed', 'deposit_released', 'released_to_mover', 'refunded_full', 'refunded_partial'));

-- Fonction de calcul des montants
CREATE OR REPLACE FUNCTION calculate_payment_amounts(mover_price_input numeric)
RETURNS TABLE (
  total_amount numeric,
  amount_paid numeric,
  platform_fee numeric,
  mover_total numeric,
  mover_deposit numeric,
  escrow_amount numeric
) AS $$
BEGIN
  total_amount := mover_price_input * 1.30;
  amount_paid := total_amount * 0.40;
  platform_fee := mover_price_input * 0.30;
  mover_total := amount_paid - platform_fee;
  mover_deposit := mover_total * 0.50;
  escrow_amount := mover_total * 0.50;
  
  RETURN QUERY SELECT 
    calculate_payment_amounts.total_amount,
    calculate_payment_amounts.amount_paid,
    calculate_payment_amounts.platform_fee,
    mover_total,
    calculate_payment_amounts.mover_deposit,
    calculate_payment_amounts.escrow_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Nouveau trigger pour mettre à jour les statuts après paiement
CREATE OR REPLACE FUNCTION update_quote_status_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    UPDATE quotes SET status = 'accepted' WHERE id = NEW.quote_id;
    UPDATE quote_requests SET accepted_quote_id = NEW.quote_id, payment_status = 'completed' WHERE id = NEW.quote_request_id;
    UPDATE quotes SET status = 'rejected' WHERE quote_request_id = NEW.quote_request_id AND id != NEW.quote_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_quote_status_after_payment ON payments;
CREATE TRIGGER trigger_update_quote_status_after_payment
  AFTER INSERT OR UPDATE OF payment_status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_status_after_payment();

-- Fonction pour créer un paiement avec les bons calculs
CREATE OR REPLACE FUNCTION create_payment_with_correct_calculations(
  p_quote_request_id uuid,
  p_quote_id uuid,
  p_client_id uuid,
  p_mover_id uuid,
  p_mover_price numeric,
  p_stripe_payment_id text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_payment_id uuid;
  v_amounts record;
BEGIN
  SELECT * INTO v_amounts FROM calculate_payment_amounts(p_mover_price);
  
  INSERT INTO payments (
    quote_request_id, quote_id, client_id, mover_id, mover_price,
    total_amount, amount_paid, platform_fee, mover_deposit, escrow_amount,
    remaining_amount, payment_status, stripe_payment_id, paid_at
  ) VALUES (
    p_quote_request_id, p_quote_id, p_client_id, p_mover_id, p_mover_price,
    v_amounts.total_amount, v_amounts.amount_paid, v_amounts.platform_fee,
    v_amounts.mover_deposit, v_amounts.escrow_amount,
    v_amounts.total_amount - v_amounts.amount_paid,
    'completed', p_stripe_payment_id, now()
  ) RETURNING id INTO v_payment_id;
  
  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour débloquer le dépôt 48h avant
CREATE OR REPLACE FUNCTION release_mover_deposit_before_moving()
RETURNS void AS $$
BEGIN
  UPDATE payments
  SET deposit_released = true, deposit_release_date = now(), deposit_paid_at = now(), payment_status = 'deposit_released'
  WHERE payment_status = 'completed' AND deposit_released = false
  AND quote_request_id IN (
    SELECT id FROM quote_requests
    WHERE moving_date <= (CURRENT_DATE + INTERVAL '2 days') AND moving_date > CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les paiements existants
UPDATE payments p
SET 
  mover_price = q.price,
  total_amount = q.price * 1.30,
  amount_paid = (q.price * 1.30) * 0.40,
  platform_fee = q.price * 0.30,
  mover_deposit = ((q.price * 1.30) * 0.40 - q.price * 0.30) * 0.50,
  escrow_amount = ((q.price * 1.30) * 0.40 - q.price * 0.30) * 0.50,
  remaining_amount = (q.price * 1.30) * 0.60
FROM quotes q
WHERE p.quote_id = q.id
AND (p.mover_price IS NULL OR p.mover_price = 0);

-- Mettre à jour le statut des devis déjà payés
UPDATE quotes q
SET status = 'accepted'
FROM payments p
WHERE p.quote_id = q.id
AND p.payment_status = 'completed'
AND q.status = 'pending';
