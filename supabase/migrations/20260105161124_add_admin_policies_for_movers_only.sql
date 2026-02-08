/*
  # Ajouter les policies admin manquantes pour les déménageurs

  1. Problème Identifié
    - Les admins NE PEUVENT PAS voir les nouveaux déménageurs dans le dashboard
    - La table movers n'a PAS de policy pour les admins
    - Seule policy existante : "Public can view verified movers" (uniquement movers vérifiés + actifs)

  2. Solution
    - Ajouter policy pour que les admins voient TOUS les movers (même non vérifiés)
    - Ajouter policy pour que les admins puissent modifier les movers
    - Ajouter policies pour les tables liées (documents, trucks, identity_verifications)

  3. Vérification Sécurité
    - EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
    - Seuls les comptes dans la table admins peuvent accéder
*/

-- MOVERS TABLE
-- Policy pour que les admins voient TOUS les déménageurs (vérifiés ou non, actifs ou non)
CREATE POLICY "Admins can view all movers"
  ON movers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy pour que les admins puissent modifier les profils movers
CREATE POLICY "Admins can update mover profiles"
  ON movers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- MOVER_DOCUMENTS TABLE
-- Policy pour que les admins voient tous les documents movers
CREATE POLICY "Admins can view all mover documents"
  ON mover_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy pour que les admins puissent modifier les documents movers (ex: verification_status)
CREATE POLICY "Admins can update mover documents"
  ON mover_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- TRUCKS TABLE
-- Policy pour que les admins voient tous les véhicules
CREATE POLICY "Admins can view all trucks"
  ON trucks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy pour que les admins puissent modifier les véhicules (ex: is_verified)
CREATE POLICY "Admins can update trucks"
  ON trucks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- IDENTITY_VERIFICATIONS TABLE  
-- Policy pour que les admins voient toutes les vérifications d'identité
CREATE POLICY "Admins can view all identity verifications"
  ON identity_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy pour que les admins puissent modifier les vérifications d'identité
CREATE POLICY "Admins can update identity verifications"
  ON identity_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- MOVER_UNAVAILABILITY TABLE
-- Policy pour que les admins voient les indisponibilités des movers
CREATE POLICY "Admins can view mover unavailability"
  ON mover_unavailability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- MOVER_BADGES TABLE
-- Policy pour que les admins voient les badges des movers
CREATE POLICY "Admins can view mover badges"
  ON mover_badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- MOVER_PORTFOLIO TABLE
-- Policy pour que les admins voient les portfolios des movers
CREATE POLICY "Admins can view mover portfolio"
  ON mover_portfolio FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );
