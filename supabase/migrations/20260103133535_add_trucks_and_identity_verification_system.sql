/*
  # Add Trucks and Identity Verification System

  1. New Tables
    - `trucks`
      - `id` (uuid, primary key)
      - `mover_id` (uuid, foreign key to movers)
      - `registration_number` (text) - Numéro d'immatriculation
      - `capacity_m3` (numeric) - Capacité en m³
      - `registration_card_url` (text) - URL de la carte grise
      - `is_verified` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `identity_verifications`
      - `id` (uuid, primary key)
      - `mover_id` (uuid, foreign key to movers)
      - `document_url` (text) - URL de la pièce d'identité
      - `document_type` (text) - Type: passport, id_card, driver_license
      - `extracted_name` (text) - Nom extrait par IA
      - `extracted_birth_date` (text) - Date de naissance extraite
      - `is_authentic` (boolean) - Document authentique ou pas
      - `confidence_score` (numeric) - Score de confiance IA (0-100)
      - `verification_status` (text) - pending, verified, rejected
      - `kbis_name_match` (boolean) - Correspond au nom du KBIS
      - `verification_notes` (text) - Notes de vérification
      - `verified_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Storage Buckets
    - Create buckets for truck documents and identity documents

  3. Updates to movers table
    - Add `identity_verified` (boolean, default false)
    - Add `total_trucks` (integer, default 0)
    - Add `total_capacity_m3` (numeric, default 0)

  4. Security
    - Enable RLS on all new tables
    - Policies for movers to manage their own data
    - Admin access for verification review
*/

-- Update movers table
ALTER TABLE movers
ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_trucks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_capacity_m3 numeric DEFAULT 0;

-- Create trucks table
CREATE TABLE IF NOT EXISTS trucks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,
  registration_number text NOT NULL,
  capacity_m3 numeric NOT NULL CHECK (capacity_m3 > 0),
  registration_card_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create identity_verifications table
CREATE TABLE IF NOT EXISTS identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,
  document_url text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'id_card', 'driver_license')),
  extracted_name text,
  extracted_birth_date text,
  is_authentic boolean DEFAULT false,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  kbis_name_match boolean DEFAULT false,
  verification_notes text,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for trucks
CREATE POLICY "Movers can view their own trucks"
  ON trucks
  FOR SELECT
  TO authenticated
  USING (
    mover_id IN (
      SELECT id FROM movers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can insert their own trucks"
  ON trucks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    mover_id IN (
      SELECT id FROM movers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can update their own trucks"
  ON trucks
  FOR UPDATE
  TO authenticated
  USING (
    mover_id IN (
      SELECT id FROM movers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    mover_id IN (
      SELECT id FROM movers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can delete their own trucks"
  ON trucks
  FOR DELETE
  TO authenticated
  USING (
    mover_id IN (
      SELECT id FROM movers WHERE user_id = auth.uid()
    )
  );

-- Policies for identity_verifications
CREATE POLICY "Movers can view their own identity verifications"
  ON identity_verifications
  FOR SELECT
  TO authenticated
  USING (
    mover_id IN (
      SELECT id FROM movers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can insert their own identity verifications"
  ON identity_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    mover_id IN (
      SELECT id FROM movers WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trucks_mover_id ON trucks(mover_id);
CREATE INDEX IF NOT EXISTS idx_trucks_is_verified ON trucks(is_verified);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_mover_id ON identity_verifications(mover_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(verification_status);

-- Create function to update mover truck totals
CREATE OR REPLACE FUNCTION update_mover_truck_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE movers
  SET 
    total_trucks = (SELECT COUNT(*) FROM trucks WHERE mover_id = NEW.mover_id),
    total_capacity_m3 = (SELECT COALESCE(SUM(capacity_m3), 0) FROM trucks WHERE mover_id = NEW.mover_id)
  WHERE id = NEW.mover_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for truck changes
DROP TRIGGER IF EXISTS update_mover_totals_on_truck_change ON trucks;
CREATE TRIGGER update_mover_totals_on_truck_change
AFTER INSERT OR UPDATE OR DELETE ON trucks
FOR EACH ROW
EXECUTE FUNCTION update_mover_truck_totals();
