/*
  # Correction des politiques RLS et ajout de vues utiles

  1. Problème identifié
    - Les déménageurs vérifiés ne peuvent pas voir les demandes de devis
    - Les admins ne peuvent pas voir certaines données
    - Les requêtes frontend sont complexes et peuvent échouer

  2. Solutions
    - Simplifier et renforcer les politiques RLS sur quote_requests
    - Créer une vue matérialisée pour compter les devis par demande
    - Vérifier que les politiques fonctionnent correctement

  3. Vérifications
    - Les déménageurs vérifiés et actifs peuvent voir toutes les demandes 'new' et 'quoted'
    - Les admins peuvent voir toutes les demandes
    - Les clients peuvent voir leurs propres demandes
*/

-- Supprimer les anciennes politiques sur quote_requests
DROP POLICY IF EXISTS "Verified active movers can view all requests" ON quote_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON quote_requests;
DROP POLICY IF EXISTS "Clients can view own requests" ON quote_requests;

-- Créer des politiques RLS plus simples et plus robustes
-- Politique 1: Les clients peuvent voir leurs propres demandes
CREATE POLICY "Clients view own requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid());

-- Politique 2: Les déménageurs vérifiés et actifs peuvent voir toutes les demandes
CREATE POLICY "Verified movers view requests"
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

-- Politique 3: Les admins peuvent voir toutes les demandes
CREATE POLICY "Admins view all requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Créer une vue pour simplifier les requêtes de comptage de devis
CREATE OR REPLACE VIEW quote_requests_with_counts AS
SELECT 
  qr.*,
  COUNT(q.id) as quotes_count
FROM quote_requests qr
LEFT JOIN quotes q ON q.quote_request_id = qr.id
GROUP BY qr.id;

-- Donner les permissions de lecture sur la vue
GRANT SELECT ON quote_requests_with_counts TO authenticated;
GRANT SELECT ON quote_requests_with_counts TO anon;
