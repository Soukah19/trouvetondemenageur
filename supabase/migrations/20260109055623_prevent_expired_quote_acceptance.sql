/*
  # Empecher l'acceptation de devis expires - Protection securite critique

  1. Protection au niveau base de donnees
    - Trigger sur quotes: Empeche le changement de status vers 'accepted' si status actuel est 'expired' ou 'rejected'
    - Trigger sur payments: Empeche l'insertion de paiements pour des devis non-pending
    - Constraint: Garantit l'integrite des donnees

  2. Securite
    - Protection contre acceptation de devis expires
    - Protection contre paiements invalides
    - Validation au niveau BDD (incontournable)

  3. Notes importantes
    - Ces triggers sont CRITIQUES pour la securite financiere
    - Empechent les clients de payer des devis bases sur anciennes informations
    - Garantissent que seuls les devis 'pending' peuvent etre acceptes
*/

-- Fonction trigger pour empecher l'acceptation de devis expires
CREATE OR REPLACE FUNCTION prevent_expired_quote_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Empecher le changement vers 'accepted' si le devis est expire ou rejete
  IF NEW.status = 'accepted' AND OLD.status IN ('expired', 'rejected') THEN
    RAISE EXCEPTION 'Cannot accept a quote with status %. Only pending quotes can be accepted.', OLD.status;
  END IF;

  -- Empecher le changement vers 'accepted' si le devis n'est pas 'pending'
  IF NEW.status = 'accepted' AND OLD.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending quotes can be accepted. Current status: %', OLD.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur la table quotes
DROP TRIGGER IF EXISTS check_quote_status_before_acceptance ON quotes;
CREATE TRIGGER check_quote_status_before_acceptance
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION prevent_expired_quote_acceptance();

-- Fonction trigger pour valider les paiements
CREATE OR REPLACE FUNCTION validate_payment_quote_status()
RETURNS TRIGGER AS $$
DECLARE
  v_quote_status TEXT;
  v_request_status TEXT;
BEGIN
  -- Recuperer le statut du devis
  SELECT status INTO v_quote_status
  FROM quotes
  WHERE id = NEW.quote_id;

  -- Verifier que le devis existe
  IF v_quote_status IS NULL THEN
    RAISE EXCEPTION 'Quote % does not exist', NEW.quote_id;
  END IF;

  -- Empecher le paiement si le devis n''est pas 'pending'
  IF v_quote_status != 'pending' THEN
    RAISE EXCEPTION 'Cannot create payment for quote with status %. Only pending quotes can be paid.', v_quote_status;
  END IF;

  -- Recuperer le statut de la demande
  SELECT status INTO v_request_status
  FROM quote_requests
  WHERE id = NEW.quote_request_id;

  -- Empecher le paiement si la demande est deja acceptee ou completee
  IF v_request_status IN ('accepted', 'completed') THEN
    RAISE EXCEPTION 'Cannot create payment for quote request with status %. This request has already been accepted or completed.', v_request_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur la table payments
DROP TRIGGER IF EXISTS validate_payment_before_insert ON payments;
CREATE TRIGGER validate_payment_before_insert
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_quote_status();

-- Index pour ameliorer les performances des validations
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
