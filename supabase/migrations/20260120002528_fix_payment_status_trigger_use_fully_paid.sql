/*
  # Corriger le trigger de paiement pour utiliser 'fully_paid' au lieu de 'completed'
  
  1. Correction du trigger
    - Remplacer 'completed' par 'fully_paid' dans update_quote_status_after_payment()
    - Cela respecte la contrainte CHECK de quote_requests
  
  2. Statuts valides pour payment_status dans quote_requests
    - 'no_payment' - Aucun paiement
    - 'deposit_paid' - Acompte payé
    - 'fully_paid' - Paiement complet
    - 'refunded' - Remboursé
*/

-- Recréer la fonction avec le bon statut
CREATE OR REPLACE FUNCTION update_quote_status_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le statut de paiement de la demande de devis
  UPDATE quote_requests 
  SET 
    accepted_quote_id = NEW.quote_id,
    payment_status = 'fully_paid'
  WHERE id = NEW.quote_request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;