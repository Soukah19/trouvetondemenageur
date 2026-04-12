/*
  # Reconstruction complète de TrouveTonDemenageur

  1. Tables supprimées
    - Suppression des anciennes tables (companies, reviews, quote_requests)

  2. Nouvelles Tables
    - `movers` - Profils des déménageurs partenaires
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Référence auth.users
      - `company_name` (text) - Nom de l'entreprise
      - `siret` (text) - Numéro SIRET
      - `manager_firstname` (text) - Prénom du gérant
      - `manager_lastname` (text) - Nom du gérant
      - `manager_phone` (text) - Téléphone du gérant
      - `email` (text) - Email de contact
      - `phone` (text) - Téléphone entreprise
      - `address` (text) - Adresse
      - `city` (text) - Ville
      - `postal_code` (text) - Code postal
      - `description` (text) - Description de l'entreprise
      - `services` (text[]) - Services proposés
      - `coverage_area` (text[]) - Zones géographiques couvertes
      - `verification_status` (text) - pending, verified, rejected
      - `is_active` (boolean) - Compte actif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `mover_documents` - Documents légaux des déménageurs
      - `id` (uuid, primary key)
      - `mover_id` (uuid, foreign key) - Référence movers
      - `document_type` (text) - kbis, insurance, license, etc.
      - `document_name` (text) - Nom du fichier
      - `document_url` (text) - URL du document
      - `verification_status` (text) - pending, approved, rejected
      - `verification_notes` (text) - Notes de vérification
      - `uploaded_at` (timestamptz)

    - `quote_requests` - Demandes de devis des clients
      - `id` (uuid, primary key)
      - `client_user_id` (uuid, nullable) - Référence auth.users si connecté
      - `client_name` (text) - Nom du client
      - `client_email` (text) - Email du client
      - `client_phone` (text) - Téléphone du client
      - `from_address` (text) - Adresse de départ
      - `from_city` (text) - Ville de départ
      - `from_postal_code` (text) - Code postal départ
      - `to_address` (text) - Adresse d'arrivée
      - `to_city` (text) - Ville d'arrivée
      - `to_postal_code` (text) - Code postal arrivée
      - `moving_date` (date) - Date souhaitée
      - `home_size` (text) - Taille du logement
      - `home_type` (text) - Type de logement
      - `floor_from` (integer) - Étage départ
      - `floor_to` (integer) - Étage arrivée
      - `elevator_from` (boolean) - Ascenseur départ
      - `elevator_to` (boolean) - Ascenseur arrivée
      - `services_needed` (text[]) - Services demandés
      - `additional_info` (text) - Informations complémentaires
      - `status` (text) - new, assigned, quoted, accepted, completed, cancelled
      - `assigned_mover_id` (uuid, nullable) - Déménageur assigné
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `quotes` - Devis envoyés par les déménageurs
      - `id` (uuid, primary key)
      - `quote_request_id` (uuid, foreign key) - Référence quote_requests
      - `mover_id` (uuid, foreign key) - Référence movers
      - `price` (numeric) - Prix proposé
      - `message` (text) - Message du déménageur
      - `validity_date` (date) - Date de validité du devis
      - `status` (text) - pending, accepted, rejected, expired
      - `created_at` (timestamptz)

  3. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques appropriées pour chaque rôle (client/déménageur/admin)
*/

-- Supprimer les anciennes tables si elles existent
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS quote_requests CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Table des déménageurs partenaires
CREATE TABLE IF NOT EXISTS movers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  siret text NOT NULL UNIQUE,
  manager_firstname text NOT NULL,
  manager_lastname text NOT NULL,
  manager_phone text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  description text DEFAULT '',
  services text[] DEFAULT '{}',
  coverage_area text[] DEFAULT '{}',
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table des documents des déménageurs
CREATE TABLE IF NOT EXISTS mover_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid NOT NULL REFERENCES movers(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('kbis', 'insurance', 'license', 'other')),
  document_name text NOT NULL,
  document_url text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes text,
  uploaded_at timestamptz DEFAULT now()
);

-- Table des demandes de devis
CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  from_address text NOT NULL,
  from_city text NOT NULL,
  from_postal_code text NOT NULL,
  to_address text NOT NULL,
  to_city text NOT NULL,
  to_postal_code text NOT NULL,
  moving_date date NOT NULL,
  home_size text NOT NULL,
  home_type text NOT NULL,
  floor_from integer DEFAULT 0,
  floor_to integer DEFAULT 0,
  elevator_from boolean DEFAULT false,
  elevator_to boolean DEFAULT false,
  services_needed text[] DEFAULT '{}',
  additional_info text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'quoted', 'accepted', 'completed', 'cancelled')),
  assigned_mover_id uuid REFERENCES movers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des devis
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  mover_id uuid NOT NULL REFERENCES movers(id) ON DELETE CASCADE,
  price numeric NOT NULL CHECK (price >= 0),
  message text,
  validity_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE movers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mover_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policies pour movers
CREATE POLICY "Public can view verified movers"
  ON movers FOR SELECT
  TO public
  USING (verification_status = 'verified' AND is_active = true);

CREATE POLICY "Movers can view own profile"
  ON movers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Movers can update own profile"
  ON movers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can create mover profile"
  ON movers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies pour mover_documents
CREATE POLICY "Movers can view own documents"
  ON mover_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_documents.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can upload own documents"
  ON mover_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_documents.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Policies pour quote_requests
CREATE POLICY "Anyone can create quote requests"
  ON quote_requests FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Clients can view own quote requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = client_user_id);

CREATE POLICY "Verified movers can view quote requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.user_id = auth.uid()
      AND movers.verification_status = 'verified'
      AND movers.is_active = true
    )
  );

-- Policies pour quotes
CREATE POLICY "Movers can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = quotes.mover_id
      AND movers.user_id = auth.uid()
      AND movers.verification_status = 'verified'
      AND movers.is_active = true
    )
  );

CREATE POLICY "Movers can view own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = quotes.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view quotes for their requests"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_requests
      WHERE quote_requests.id = quotes.quote_request_id
      AND quote_requests.client_user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_movers_user_id ON movers(user_id);
CREATE INDEX IF NOT EXISTS idx_movers_verification_status ON movers(verification_status);
CREATE INDEX IF NOT EXISTS idx_movers_city ON movers(city);
CREATE INDEX IF NOT EXISTS idx_mover_documents_mover_id ON mover_documents(mover_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_client_user_id ON quote_requests(client_user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_request_id ON quotes(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quotes_mover_id ON quotes(mover_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_movers_updated_at ON movers;
CREATE TRIGGER update_movers_updated_at
  BEFORE UPDATE ON movers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();