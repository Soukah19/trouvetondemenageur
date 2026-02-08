/*
  # Système de vérification complète et tracking des documents

  1. Nouvelles Tables
    - `verification_reports` : Stocke les rapports complets de vérification IA
      - `id` (uuid, primary key)
      - `mover_id` (uuid, foreign key vers movers)
      - `report_data` (jsonb) : Données complètes du rapport
      - `status` (text) : verified, needs_review, rejected
      - `score` (integer) : Score de 0 à 100
      - `created_at` (timestamptz)

  2. Modifications de la table `movers`
    - Ajout des champs de dates d'expiration :
      - `kbis_expiration_date` (date)
      - `insurance_expiration_date` (date)
      - `identity_expiration_date` (date)
      - `transport_license_expiration_date` (date)
      - `last_verification_date` (timestamptz)
      - `next_verification_due` (date)

  3. Sécurité
    - RLS activé sur verification_reports
    - Policies pour admins et movers concernés
*/

-- Créer la table verification_reports
CREATE TABLE IF NOT EXISTS verification_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid NOT NULL REFERENCES movers(id) ON DELETE CASCADE,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('verified', 'needs_review', 'rejected')),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  created_at timestamptz DEFAULT now()
);

-- Ajouter les champs de dates d'expiration aux movers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'kbis_expiration_date'
  ) THEN
    ALTER TABLE movers ADD COLUMN kbis_expiration_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'insurance_expiration_date'
  ) THEN
    ALTER TABLE movers ADD COLUMN insurance_expiration_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'identity_expiration_date'
  ) THEN
    ALTER TABLE movers ADD COLUMN identity_expiration_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'transport_license_expiration_date'
  ) THEN
    ALTER TABLE movers ADD COLUMN transport_license_expiration_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'last_verification_date'
  ) THEN
    ALTER TABLE movers ADD COLUMN last_verification_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'next_verification_due'
  ) THEN
    ALTER TABLE movers ADD COLUMN next_verification_due date;
  END IF;
END $$;

-- Activer RLS sur verification_reports
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;

-- Policy pour que les movers puissent voir leurs propres rapports
CREATE POLICY "Movers can view own verification reports"
  ON verification_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = verification_reports.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Policy pour que les admins puissent voir tous les rapports
CREATE POLICY "Admins can view all verification reports"
  ON verification_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy pour que le système puisse créer des rapports
CREATE POLICY "System can create verification reports"
  ON verification_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_verification_reports_mover_id ON verification_reports(mover_id);
CREATE INDEX IF NOT EXISTS idx_verification_reports_status ON verification_reports(status);
CREATE INDEX IF NOT EXISTS idx_verification_reports_created_at ON verification_reports(created_at DESC);

-- Index pour les dates d'expiration
CREATE INDEX IF NOT EXISTS idx_movers_kbis_expiration ON movers(kbis_expiration_date) WHERE kbis_expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movers_insurance_expiration ON movers(insurance_expiration_date) WHERE insurance_expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movers_identity_expiration ON movers(identity_expiration_date) WHERE identity_expiration_date IS NOT NULL;

-- Fonction pour vérifier les documents qui expirent bientôt
CREATE OR REPLACE FUNCTION get_expiring_documents(days_threshold integer DEFAULT 30)
RETURNS TABLE (
  mover_id uuid,
  company_name text,
  document_type text,
  expiration_date date,
  days_remaining integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.company_name,
    'KBIS'::text,
    m.kbis_expiration_date,
    (m.kbis_expiration_date - CURRENT_DATE)::integer
  FROM movers m
  WHERE m.kbis_expiration_date IS NOT NULL
    AND m.kbis_expiration_date - CURRENT_DATE <= days_threshold
    AND m.kbis_expiration_date >= CURRENT_DATE
  UNION ALL
  SELECT 
    m.id,
    m.company_name,
    'Assurance RC PRO'::text,
    m.insurance_expiration_date,
    (m.insurance_expiration_date - CURRENT_DATE)::integer
  FROM movers m
  WHERE m.insurance_expiration_date IS NOT NULL
    AND m.insurance_expiration_date - CURRENT_DATE <= days_threshold
    AND m.insurance_expiration_date >= CURRENT_DATE
  UNION ALL
  SELECT 
    m.id,
    m.company_name,
    'Pièce d''identité'::text,
    m.identity_expiration_date,
    (m.identity_expiration_date - CURRENT_DATE)::integer
  FROM movers m
  WHERE m.identity_expiration_date IS NOT NULL
    AND m.identity_expiration_date - CURRENT_DATE <= days_threshold
    AND m.identity_expiration_date >= CURRENT_DATE
  UNION ALL
  SELECT 
    m.id,
    m.company_name,
    'Licence de transport'::text,
    m.transport_license_expiration_date,
    (m.transport_license_expiration_date - CURRENT_DATE)::integer
  FROM movers m
  WHERE m.transport_license_expiration_date IS NOT NULL
    AND m.transport_license_expiration_date - CURRENT_DATE <= days_threshold
    AND m.transport_license_expiration_date >= CURRENT_DATE
  ORDER BY days_remaining ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;