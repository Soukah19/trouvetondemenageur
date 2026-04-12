/*
  # Autoriser les clients à supprimer leurs demandes de devis

  1. Nouvelle politique RLS
    - Permet aux clients de supprimer leurs propres demandes
    - SEULEMENT si status != 'accepted' ET status != 'completed'
    - Protection contre suppression de demandes en cours ou terminées

  2. Sécurité
    - Le client ne peut supprimer que SES propres demandes
    - Les demandes acceptées ou complétées ne peuvent pas être supprimées
    - Les demandes avec paiements ne peuvent pas être supprimées
*/

-- Créer une politique pour permettre aux clients de supprimer leurs demandes non acceptées
CREATE POLICY "Clients can delete their own non-accepted quote requests"
  ON quote_requests
  FOR DELETE
  TO authenticated
  USING (
    client_user_id = auth.uid()
    AND status NOT IN ('accepted', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM payments
      WHERE payments.quote_request_id = quote_requests.id
      AND payments.payment_status IN ('completed', 'deposit_released', 'released_to_mover')
    )
  );

-- Ajouter un commentaire pour documenter cette politique
COMMENT ON POLICY "Clients can delete their own non-accepted quote requests" ON quote_requests IS
  'Permet aux clients de supprimer leurs propres demandes de devis, sauf si elles sont acceptées, complétées, ou ont un paiement associé';
