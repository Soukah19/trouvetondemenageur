/*
  # Système de fin de mission et déblocage des paiements

  ## Aperçu
  Ce système permet au déménageur de déclarer la fin de mission, génère une analyse
  IA de la lettre de mission, et permet aux admins de débloquer les soldes.

  ## 1. Nouveaux champs dans la table `payments`
    - `mission_letter_url` - URL de la lettre de mission générée
    - `mission_completion_date` - Date de déclaration de fin de mission
    - `mission_completion_status` - Statut: 'in_progress', 'completed_pending_review', 'approved', 'rejected'
    - `ai_analysis_result` - Résultat de l'analyse IA (JSON)
    - `release_requested_at` - Date de demande de déblocage
    - `release_approved_by` - ID de l'admin qui a approuvé
    - `release_approved_at` - Date d'approbation
    - `release_notes` - Notes de l'admin

  ## 2. Table `payment_release_requests`
    - Table pour suivre les demandes de déblocage de paiement
    - Workflow d'approbation avec traçabilité

  ## 3. Sécurité
    - RLS pour contrôler l'accès aux demandes de déblocage
    - Seuls les super admins peuvent approuver les déblocages
*/

-- Ajouter les colonnes pour le système de fin de mission
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mission_letter_url'
  ) THEN
    ALTER TABLE payments ADD COLUMN mission_letter_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mission_completion_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN mission_completion_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mission_completion_status'
  ) THEN
    ALTER TABLE payments ADD COLUMN mission_completion_status text DEFAULT 'in_progress' CHECK (mission_completion_status IN ('in_progress', 'completed_pending_review', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'ai_analysis_result'
  ) THEN
    ALTER TABLE payments ADD COLUMN ai_analysis_result jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'release_requested_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN release_requested_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'release_approved_by'
  ) THEN
    ALTER TABLE payments ADD COLUMN release_approved_by uuid REFERENCES admins(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'release_approved_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN release_approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'release_notes'
  ) THEN
    ALTER TABLE payments ADD COLUMN release_notes text;
  END IF;
END $$;

-- Créer la table pour les demandes de déblocage de paiement
CREATE TABLE IF NOT EXISTS payment_release_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  mover_id uuid NOT NULL REFERENCES movers(id),
  requested_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ai_analysis jsonb,
  admin_notes text,
  reviewed_by uuid REFERENCES admins(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_payment_release_requests_payment_id ON payment_release_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_release_requests_mover_id ON payment_release_requests(mover_id);
CREATE INDEX IF NOT EXISTS idx_payment_release_requests_status ON payment_release_requests(status);
CREATE INDEX IF NOT EXISTS idx_payments_mission_completion_status ON payments(mission_completion_status);

-- Activer RLS
ALTER TABLE payment_release_requests ENABLE ROW LEVEL SECURITY;

-- Politique: Les déménageurs peuvent voir leurs propres demandes
CREATE POLICY "Movers can view their own release requests"
  ON payment_release_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = payment_release_requests.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Politique: Les déménageurs peuvent créer des demandes
CREATE POLICY "Movers can create release requests"
  ON payment_release_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = payment_release_requests.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Politique: Les admins peuvent voir toutes les demandes
CREATE POLICY "Admins can view all release requests"
  ON payment_release_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Politique: Les super admins peuvent approuver les demandes
CREATE POLICY "Super admins can update release requests"
  ON payment_release_requests
  FOR UPDATE
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

-- Fonction pour créer une demande de déblocage automatiquement
CREATE OR REPLACE FUNCTION create_payment_release_request(
  p_payment_id uuid,
  p_ai_analysis jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mover_id uuid;
  v_request_id uuid;
BEGIN
  -- Récupérer le mover_id depuis le payment
  SELECT mover_id INTO v_mover_id
  FROM payments
  WHERE id = p_payment_id;

  IF v_mover_id IS NULL THEN
    RAISE EXCEPTION 'Payment not found or mover_id is null';
  END IF;

  -- Créer la demande
  INSERT INTO payment_release_requests (
    payment_id,
    mover_id,
    ai_analysis,
    status
  ) VALUES (
    p_payment_id,
    v_mover_id,
    p_ai_analysis,
    'pending'
  )
  RETURNING id INTO v_request_id;

  -- Mettre à jour le statut du paiement
  UPDATE payments
  SET 
    mission_completion_status = 'completed_pending_review',
    ai_analysis_result = p_ai_analysis,
    release_requested_at = now()
  WHERE id = p_payment_id;

  RETURN v_request_id;
END;
$$;

-- Fonction pour approuver une demande de déblocage
CREATE OR REPLACE FUNCTION approve_payment_release(
  p_request_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_id uuid;
  v_admin_id uuid;
  v_escrow_amount numeric;
BEGIN
  -- Vérifier que l'utilisateur est super admin
  SELECT id INTO v_admin_id
  FROM admins
  WHERE user_id = auth.uid()
  AND role = 'super_admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only super admins can approve payment releases';
  END IF;

  -- Récupérer le payment_id
  SELECT payment_id INTO v_payment_id
  FROM payment_release_requests
  WHERE id = p_request_id;

  IF v_payment_id IS NULL THEN
    RAISE EXCEPTION 'Release request not found';
  END IF;

  -- Mettre à jour la demande
  UPDATE payment_release_requests
  SET
    status = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE id = p_request_id;

  -- Mettre à jour le paiement
  UPDATE payments
  SET
    mission_completion_status = 'approved',
    release_approved_by = v_admin_id,
    release_approved_at = now(),
    release_notes = p_admin_notes,
    payment_status = 'released_to_mover'
  WHERE id = v_payment_id;

  RETURN true;
END;
$$;

-- Fonction pour rejeter une demande de déblocage
CREATE OR REPLACE FUNCTION reject_payment_release(
  p_request_id uuid,
  p_admin_notes text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_id uuid;
  v_admin_id uuid;
BEGIN
  -- Vérifier que l'utilisateur est super admin
  SELECT id INTO v_admin_id
  FROM admins
  WHERE user_id = auth.uid()
  AND role = 'super_admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only super admins can reject payment releases';
  END IF;

  -- Récupérer le payment_id
  SELECT payment_id INTO v_payment_id
  FROM payment_release_requests
  WHERE id = p_request_id;

  IF v_payment_id IS NULL THEN
    RAISE EXCEPTION 'Release request not found';
  END IF;

  -- Mettre à jour la demande
  UPDATE payment_release_requests
  SET
    status = 'rejected',
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE id = p_request_id;

  -- Mettre à jour le paiement
  UPDATE payments
  SET
    mission_completion_status = 'rejected',
    release_notes = p_admin_notes
  WHERE id = v_payment_id;

  RETURN true;
END;
$$;

-- Vue pour les demandes en attente avec informations enrichies
CREATE OR REPLACE VIEW pending_payment_releases AS
SELECT 
  prr.id,
  prr.payment_id,
  prr.mover_id,
  prr.requested_at,
  prr.status,
  prr.ai_analysis,
  m.company_name as mover_company_name,
  m.email as mover_email,
  m.phone as mover_phone,
  p.total_amount,
  p.escrow_amount,
  p.mover_deposit,
  qr.client_name,
  qr.from_city,
  qr.to_city,
  qr.moving_date
FROM payment_release_requests prr
JOIN movers m ON m.id = prr.mover_id
JOIN payments p ON p.id = prr.payment_id
JOIN quote_requests qr ON qr.id = p.quote_request_id
WHERE prr.status = 'pending'
ORDER BY prr.requested_at DESC;

-- Accorder l'accès à la vue
GRANT SELECT ON pending_payment_releases TO authenticated;
