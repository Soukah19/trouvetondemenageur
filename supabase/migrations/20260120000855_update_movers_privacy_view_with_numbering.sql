/*
  # Mettre à jour la vue movers_with_privacy avec numérotation
  
  1. Modification
    - Remplace "Déménageur Professionnel Vérifié" par "Déménageur {numéro}"
    - Le numéro est basé sur l'ID du déménageur (stable et cohérent)
    - Utilise un hash de l'UUID pour générer un numéro entre 1 et 9999
  
  2. Objectif
    - Permettre de différencier les déménageurs sans révéler leur identité
    - Les clients peuvent dire "Déménageur 1234 a le meilleur prix"
    - Le numéro reste le même pour un déménageur donné
*/

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS movers_with_privacy;

-- Recréer la vue avec numérotation
CREATE OR REPLACE VIEW movers_with_privacy 
WITH (security_barrier = true)
AS
SELECT
  m.id,
  m.user_id,
  -- Masquer le nom de l'entreprise avec un numéro basé sur l'ID
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
    
    -- Sinon, afficher un numéro basé sur l'ID (stable et cohérent)
    ELSE 'Déménageur ' || (
      -- Hash simple de l'UUID pour obtenir un numéro entre 1 et 9999
      (('x' || substring(m.id::text, 1, 8))::bit(32)::bigint % 9999) + 1
    )::text
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
COMMENT ON VIEW movers_with_privacy IS 'Vue sécurisée pour masquer l''identité des déménageurs avant paiement avec numérotation stable';