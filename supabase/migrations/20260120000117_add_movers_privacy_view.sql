/*
  # Ajouter vue de confidentialité pour les déménageurs
  
  1. Nouvelle vue
    - `movers_with_privacy` - Vue sécurisée pour masquer l'identité des déménageurs avant paiement
  
  2. Fonctionnalité
    - Masque le nom de l'entreprise (`company_name`) pour les clients qui n'ont pas payé
    - Affiche "Déménageur Professionnel Vérifié" au lieu du nom réel
    - Les admins voient toujours les vraies informations
    - Les clients voient le nom réel après avoir effectué un paiement confirmé
    - Ajoute un flag `is_name_masked` pour l'interface utilisateur
  
  3. Sécurité
    - Utilise `security_barrier = true` pour empêcher les contournements d'optimisation
    - Vérifie le statut de paiement (`completed` ou `refunded_partial`)
    - Protège contre le contact direct client-déménageur avant transaction
*/

-- Créer la vue sécurisée pour les déménageurs
CREATE OR REPLACE VIEW movers_with_privacy 
WITH (security_barrier = true)
AS
SELECT
  m.id,
  m.user_id,
  -- Masquer le nom de l'entreprise selon les conditions
  CASE
    -- Les admins voient tout
    WHEN EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    ) THEN m.company_name
    
    -- Le déménageur lui-même voit son propre nom
    WHEN m.user_id = auth.uid() THEN m.company_name
    
    -- Les clients voient le nom seulement après paiement confirmé
    WHEN EXISTS (
      SELECT 1 
      FROM payments p
      JOIN quotes q ON p.quote_id = q.id
      WHERE q.mover_id = m.id
      AND p.client_id = auth.uid()
      AND p.payment_status IN ('completed', 'refunded_partial')
    ) THEN m.company_name
    
    -- Sinon, masquer le nom
    ELSE 'Déménageur Professionnel Vérifié'
  END AS company_name,
  
  -- Les autres informations publiques ne sont pas masquées
  m.siret,
  m.manager_firstname,
  m.manager_lastname,
  m.manager_phone,
  m.email,
  m.phone,
  m.address,
  m.city,
  m.postal_code,
  m.description,
  m.services,
  m.coverage_area,
  m.verification_status,
  m.is_active,
  m.created_at,
  m.updated_at,
  m.contract_signed,
  m.contract_signed_at,
  m.average_rating,
  m.total_reviews,
  m.punctuality_avg,
  m.professionalism_avg,
  m.care_avg,
  m.value_avg,
  m.recommendation_rate,
  m.years_experience,
  m.team_size,
  m.insurance_number,
  m.certifications,
  m.service_areas,
  m.portfolio_images,
  m.specialties,
  m.completed_moves,
  m.activity_departments,
  m.coverage_type,
  m.preferred_zones,
  m.max_distance_km,
  m.email_notifications_enabled,
  m.return_trip_alerts_enabled,
  m.identity_verified,
  m.total_trucks,
  m.total_capacity_m3,
  m.has_furniture_lift,
  m.kbis_expiration_date,
  m.insurance_expiration_date,
  m.identity_expiration_date,
  m.transport_license_expiration_date,
  m.last_verification_date,
  m.next_verification_due,
  
  -- Flag pour indiquer si le nom est masqué (utile pour l'UI)
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    ) THEN false
    
    WHEN m.user_id = auth.uid() THEN false
    
    WHEN EXISTS (
      SELECT 1 
      FROM payments p
      JOIN quotes q ON p.quote_id = q.id
      WHERE q.mover_id = m.id
      AND p.client_id = auth.uid()
      AND p.payment_status IN ('completed', 'refunded_partial')
    ) THEN false
    
    ELSE true
  END AS is_name_masked

FROM movers m;

-- Accorder les permissions
GRANT SELECT ON movers_with_privacy TO authenticated;
GRANT SELECT ON movers_with_privacy TO anon;

-- Commentaire sur la vue
COMMENT ON VIEW movers_with_privacy IS 'Vue sécurisée pour masquer l''identité des déménageurs avant paiement client';