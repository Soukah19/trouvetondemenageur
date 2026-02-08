/*
  # Correction des politiques RLS pour quote_requests

  1. Changements
    - Supprime les politiques RLS dupliquées
    - Garde uniquement les politiques nécessaires et claires
    - Assure que les déménageurs vérifiés peuvent voir toutes les demandes

  2. Sécurité
    - Les déménageurs vérifiés et actifs peuvent voir toutes les demandes
    - Les clients peuvent voir leurs propres demandes
    - Les admins ont un accès complet
*/

-- Supprimer toutes les anciennes politiques SELECT
DROP POLICY IF EXISTS "Admins can view all quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Clients can view own quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Clients can view their own quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Movers can view quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Verified movers can view all quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Verified movers can view quote requests" ON quote_requests;

-- Créer des politiques claires et sans duplication
CREATE POLICY "Verified active movers can view all requests"
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
  );

CREATE POLICY "Clients can view own requests"
  ON quote_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_user_id);

CREATE POLICY "Admins can view all requests"
  ON quote_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );
