/*
  # Système de Remboursements

  1. Nouvelle Table
    - `refunds`
      - `id` (uuid, primary key)
      - `payment_id` (uuid, foreign key vers payments)
      - `client_id` (uuid, foreign key vers auth.users)
      - `quote_id` (uuid, foreign key vers quotes)
      - `amount` (numeric) - Montant du remboursement
      - `reason` (text) - Raison du remboursement
      - `status` (text) - pending, approved, rejected, completed
      - `requested_at` (timestamptz)
      - `processed_at` (timestamptz)
      - `processed_by` (uuid, foreign key vers admins)
      - `notes` (text) - Notes administratives
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Activer RLS
    - Politiques pour super admins uniquement
*/

-- Créer la table refunds
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES admins(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les super admins peuvent voir tous les remboursements
CREATE POLICY "Super admins can view all refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
  );

-- Politique: Seuls les super admins peuvent créer des remboursements
CREATE POLICY "Super admins can create refunds"
  ON refunds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
  );

-- Politique: Seuls les super admins peuvent mettre à jour des remboursements
CREATE POLICY "Super admins can update refunds"
  ON refunds
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

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_client_id ON refunds(client_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_at ON refunds(requested_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refunds_updated_at_trigger
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_refunds_updated_at();
