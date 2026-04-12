/*
  # Créer la table clients

  1. Nouvelle table
    - Table `clients` pour stocker les informations des clients
    - Champs: user_id, email, first_name, last_name, phone
    - Trigger pour notifier les admins lors d'une nouvelle inscription

  2. Sécurité
    - RLS activé sur la table clients
    - Policies pour que les clients puissent voir et modifier leur propre profil
    - Les admins peuvent voir et gérer tous les clients
*/

-- Créer la table clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy pour que les clients puissent voir leur propre profil
CREATE POLICY "Clients can view own profile"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy pour que les clients puissent modifier leur propre profil
CREATE POLICY "Clients can update own profile"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy pour que les clients puissent créer leur profil
CREATE POLICY "Clients can insert own profile"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy pour que les admins puissent voir tous les clients
CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy pour que les admins puissent modifier les clients
CREATE POLICY "Admins can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy pour que les admins puissent supprimer les clients
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Fonction pour notifier les admins lors d'une nouvelle inscription client
CREATE OR REPLACE FUNCTION notify_admins_on_client_insert()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_record RECORD;
  client_name TEXT;
BEGIN
  -- Construire le nom du client
  client_name := COALESCE(
    NULLIF(TRIM(NEW.first_name || ' ' || NEW.last_name), ''),
    NEW.email,
    'Client inconnu'
  );

  -- Notifier tous les admins
  FOR admin_record IN
    SELECT user_id FROM admins
  LOOP
    INSERT INTO notifications (
      user_id,
      user_type,
      type,
      title,
      message,
      created_at
    ) VALUES (
      admin_record.user_id,
      'admin',
      'client_registration',
      'Nouvelle inscription client',
      'Un nouveau client s''est inscrit: ' || client_name || ' (' || NEW.email || ')',
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Créer le trigger pour l'inscription client
DROP TRIGGER IF EXISTS on_client_signup ON clients;
CREATE TRIGGER on_client_signup
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_client_insert();

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
