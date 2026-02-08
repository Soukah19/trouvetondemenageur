/*
  # Ajout du calcul de distance et prix du marché

  1. Modifications
    - Ajoute `distance_km` (numeric) : Distance réelle en kilomètres entre départ et arrivée
    - Ajoute `market_price_estimate` (numeric) : Prix estimé du marché calculé par la plateforme
    
  2. Utilité
    - La distance réelle permet un calcul précis du coût de transport
    - Le prix du marché permet d'évaluer si les devis des déménageurs sont cohérents
    - Ces données aident les admins à surveiller la qualité des devis
    
  3. Notes
    - La distance sera calculée via l'API Google Maps lors de la création de la demande
    - Le prix du marché sera calculé automatiquement selon la formule du marché français 2026
*/

-- Ajouter le champ distance_km à la table quote_requests
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS distance_km numeric;

-- Ajouter le champ market_price_estimate à la table quote_requests
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS market_price_estimate numeric;

-- Ajouter un commentaire explicatif sur les colonnes
COMMENT ON COLUMN quote_requests.distance_km IS 'Distance réelle en kilomètres calculée via Google Maps API';
COMMENT ON COLUMN quote_requests.market_price_estimate IS 'Prix estimé du marché français calculé automatiquement par la plateforme';
