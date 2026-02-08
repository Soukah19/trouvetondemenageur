/*
  # Création de la table verification_documents manquante
  
  ## Problème identifié
  La table `verification_documents` est utilisée dans le code frontend mais n'existe PAS dans la base de données.
  Cela empêche les admins de voir les documents légaux des déménageurs.
  
  ## Solution
  1. Création de la table `verification_documents`
  2. Ajout de toutes les colonnes nécessaires
  3. Activation RLS avec policies pour admins et déménageurs
  4. Index pour performance
  
  ## Structure
  - id (uuid, primary key)
  - mover_id (uuid, foreign key vers movers)
  - document_type (text) : kbis, insurance, id_card, driver_license, vehicle_registration, etc.
  - document_url (text) : chemin du document dans storage
  - verification_status (text) : pending, verified, rejected
  - expiration_date (date) : date d'expiration du document
  - uploaded_at (timestamptz) : date d'upload
  - created_at (timestamptz)
  - updated_at (timestamptz)
*/

-- Créer la table verification_documents
CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid NOT NULL REFERENCES movers(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'kbis',
    'insurance',
    'id_card',
    'passport',
    'driver_license',
    'vehicle_registration',
    'technical_control',
    'transport_license',
    'other'
  )),
  document_url text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  expiration_date date,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- Policy : Les admins peuvent tout voir
CREATE POLICY "Admins can view all verification documents"
  ON verification_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy : Les admins peuvent tout modifier
CREATE POLICY "Admins can update all verification documents"
  ON verification_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy : Les admins peuvent insérer des documents
CREATE POLICY "Admins can insert verification documents"
  ON verification_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy : Les déménageurs peuvent voir leurs propres documents
CREATE POLICY "Movers can view own verification documents"
  ON verification_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = verification_documents.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Policy : Les déménageurs peuvent uploader leurs documents
CREATE POLICY "Movers can insert own verification documents"
  ON verification_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = verification_documents.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Policy : Les déménageurs peuvent mettre à jour leurs propres documents
CREATE POLICY "Movers can update own verification documents"
  ON verification_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = verification_documents.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Policy : Les admins peuvent supprimer des documents
CREATE POLICY "Admins can delete verification documents"
  ON verification_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_verification_documents_mover_id ON verification_documents(mover_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_type ON verification_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_verification_documents_status ON verification_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_uploaded_at ON verification_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_documents_expiration ON verification_documents(expiration_date) WHERE expiration_date IS NOT NULL;

-- Commentaire
COMMENT ON TABLE verification_documents IS 'Table des documents de vérification des déménageurs (KBIS, assurance, pièces d''identité, etc.) avec suivi des expirations et statuts de vérification';
