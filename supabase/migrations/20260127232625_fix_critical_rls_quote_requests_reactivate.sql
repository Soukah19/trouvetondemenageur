/*
  # CORRECTION CRITIQUE - Réactivation RLS sur quote_requests
  
  ## PROBLÈME IDENTIFIÉ
  La table quote_requests a RLS DÉSACTIVÉ, ce qui expose toutes les données clients:
  - Adresses complètes
  - Téléphones
  - Emails
  - Informations sensibles
  
  ## SOLUTION
  Réactiver RLS immédiatement sur quote_requests
  
  ## SÉCURITÉ
  Cette correction est CRITIQUE pour la protection des données
*/

-- Réactiver RLS sur quote_requests
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Vérifier que les policies existantes sont bien en place
-- Si elles n'existent pas, les créer

-- Policy pour les clients (voir leurs propres demandes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quote_requests' 
    AND policyname = 'Clients can view own quote requests'
  ) THEN
    CREATE POLICY "Clients can view own quote requests"
      ON quote_requests
      FOR SELECT
      TO authenticated
      USING (auth.uid() = client_user_id);
  END IF;
END $$;

-- Policy pour les clients (créer leurs demandes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quote_requests' 
    AND policyname = 'Clients can create quote requests'
  ) THEN
    CREATE POLICY "Clients can create quote requests"
      ON quote_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = client_user_id);
  END IF;
END $$;

-- Policy pour les clients (modifier leurs demandes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quote_requests' 
    AND policyname = 'Clients can update own quote requests'
  ) THEN
    CREATE POLICY "Clients can update own quote requests"
      ON quote_requests
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = client_user_id)
      WITH CHECK (auth.uid() = client_user_id);
  END IF;
END $$;

-- Policy pour les déménageurs vérifiés (voir les demandes non assignées ou qui leur sont assignées)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quote_requests' 
    AND policyname = 'Verified movers can view requests'
  ) THEN
    CREATE POLICY "Verified movers can view requests"
      ON quote_requests
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM movers
          WHERE movers.user_id = auth.uid()
          AND movers.verification_status = 'verified'
          AND movers.is_active = true
        )
        AND (
          status IN ('new', 'assigned', 'quoted')
          OR assigned_mover_id IN (
            SELECT id FROM movers WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Policy pour les admins (accès complet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quote_requests' 
    AND policyname = 'Admins have full access'
  ) THEN
    CREATE POLICY "Admins have full access"
      ON quote_requests
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admins
          WHERE admins.user_id = auth.uid()
        )
      );
  END IF;
END $$;
