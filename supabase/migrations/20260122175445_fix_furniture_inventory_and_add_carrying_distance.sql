/*
  # Correction colonne furniture_inventory et ajout distance de portage

  1. Corrections
    - S'assure que la colonne `furniture_inventory` existe dans `quote_requests`
    - Ajoute index GIN pour recherche JSON performante

  2. Nouveaux Champs
    - `carrying_distance_from` (text) : Distance de portage à l'adresse de départ
      - Valeurs possibles : '10m', '20m', '30m', '40m', 'plus_40m'
    - `carrying_distance_to` (text) : Distance de portage à l'adresse d'arrivée
      - Valeurs possibles : '10m', '20m', '30m', '40m', 'plus_40m'

  3. Sécurité
    - Aucune modification RLS nécessaire (utilise les politiques existantes)
    - Tous les champs sont nullable pour compatibilité avec demandes existantes

  ## Important
  La distance de portage est cruciale pour le calcul du prix car elle impacte :
  - Le temps nécessaire pour le déménagement
  - Le nombre de manutentionnaires requis
  - La difficulté logistique
*/

-- S'assurer que furniture_inventory existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'furniture_inventory'
  ) THEN
    ALTER TABLE quote_requests
    ADD COLUMN furniture_inventory jsonb DEFAULT NULL;
    
    COMMENT ON COLUMN quote_requests.furniture_inventory IS
    'Inventaire détaillé des meubles sélectionnés dans le calculateur de volume. Format JSON: {selectedItems: {itemName: count}, customFurniture: [{name, volume, count}]}';
  END IF;
END $$;

-- Créer un index GIN pour recherche performante sur JSON
CREATE INDEX IF NOT EXISTS idx_quote_requests_furniture_inventory
ON quote_requests USING GIN (furniture_inventory);

-- Ajouter les champs de distance de portage
DO $$
BEGIN
  -- Distance de portage départ
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'carrying_distance_from'
  ) THEN
    ALTER TABLE quote_requests
    ADD COLUMN carrying_distance_from text DEFAULT NULL
    CHECK (carrying_distance_from IS NULL OR carrying_distance_from IN ('10m', '20m', '30m', '40m', 'plus_40m'));
  END IF;

  -- Distance de portage arrivée
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'carrying_distance_to'
  ) THEN
    ALTER TABLE quote_requests
    ADD COLUMN carrying_distance_to text DEFAULT NULL
    CHECK (carrying_distance_to IS NULL OR carrying_distance_to IN ('10m', '20m', '30m', '40m', 'plus_40m'));
  END IF;
END $$;

-- Ajouter des commentaires explicatifs
COMMENT ON COLUMN quote_requests.carrying_distance_from IS
'Distance de portage à l''adresse de départ (du camion à l''entrée du logement). Valeurs: 10m, 20m, 30m, 40m, plus_40m';

COMMENT ON COLUMN quote_requests.carrying_distance_to IS
'Distance de portage à l''adresse d''arrivée (du camion à l''entrée du logement). Valeurs: 10m, 20m, 30m, 40m, plus_40m';
