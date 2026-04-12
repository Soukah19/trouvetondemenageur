/*
  # Correction du système de commission à 30%

  ## Changements
  
  1. **Nouveau calcul de commission : 30%**
     - Prix déménageur (price) : montant que le déménageur reçoit au total
     - Commission plateforme : 30% du prix déménageur
     - Prix client (client_display_price) : price × 1.30
  
  2. **Nouveau système de paiement (acompte = 40% du prix client) :**
     - Commission prélevée : 30% du prix déménageur (montant total)
     - Acompte versé au déménageur : 10% du prix déménageur
     - Escrow pour déménageur : reste de l'acompte après commission et acompte
     - Solde final : 60% du prix client, payé directement par le client au déménageur
  
  3. **Nouveaux champs dans payments :**
     - escrow_amount : montant gardé en escrow pour le déménageur
     - direct_payment_amount : montant à payer directement au déménageur
     - escrow_released : si l'escrow a été libéré
     - escrow_release_date : date de libération de l'escrow
  
  ## Exemple de calcul
  
  - Prix déménageur : 1000€
  - Commission (30%) : 300€
  - Prix client : 1300€
  
  Acompte (40% de 1300€ = 520€) :
  - Commission plateforme : 300€
  - Acompte déménageur (10% de 1000€) : 100€
  - Escrow déménageur : 120€
  
  Solde (60% de 1300€ = 780€) :
  - Payé directement par le client au déménageur
  
  Total déménageur : 100€ + 120€ + 780€ = 1000€ ✓
  Total plateforme : 300€ ✓
  Total client : 520€ + 780€ = 1300€ ✓
*/

-- Ajouter les nouveaux champs au tableau payments
DO $$
BEGIN
  -- Escrow amount (montant gardé pour le déménageur)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'escrow_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN escrow_amount numeric CHECK (escrow_amount >= 0) DEFAULT 0;
  END IF;

  -- Direct payment amount (montant à payer directement au déménageur)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'direct_payment_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN direct_payment_amount numeric CHECK (direct_payment_amount >= 0) DEFAULT 0;
  END IF;

  -- Escrow released flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'escrow_released'
  ) THEN
    ALTER TABLE payments ADD COLUMN escrow_released boolean DEFAULT false;
  END IF;

  -- Escrow release date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'escrow_release_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN escrow_release_date timestamptz;
  END IF;
END $$;

-- Ajouter des commentaires pour documenter le système
COMMENT ON TABLE payments IS 'Système de paiement avec commission 30% : Le client paie 40% d''acompte (commission 30% + acompte déménageur 10% + escrow), puis 60% directement au déménageur à la fin.';
COMMENT ON COLUMN payments.platform_fee IS 'Commission de la plateforme : 30% du prix déménageur, prélevée sur l''acompte';
COMMENT ON COLUMN payments.mover_deposit IS 'Acompte versé au déménageur : 10% du prix déménageur';
COMMENT ON COLUMN payments.escrow_amount IS 'Montant gardé en escrow pour le déménageur, libéré après le service';
COMMENT ON COLUMN payments.direct_payment_amount IS 'Montant à payer directement par le client au déménageur (60% du prix client)';
