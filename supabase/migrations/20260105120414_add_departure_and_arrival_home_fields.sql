/*
  # Ajouter les caractéristiques séparées pour logements de départ et d'arrivée

  1. Modifications de la table `quote_requests`
    - Ajouter `from_home_size` (text) - Taille du logement de départ
    - Ajouter `from_home_type` (text) - Type du logement de départ
    - Ajouter `from_surface_m2` (numeric) - Surface du logement de départ en m²
    - Ajouter `to_home_size` (text) - Taille du logement d'arrivée
    - Ajouter `to_home_type` (text) - Type du logement d'arrivée
    - Ajouter `to_surface_m2` (numeric) - Surface du logement d'arrivée en m²

  2. Migration des données existantes
    - Copier les valeurs de `home_size` vers `from_home_size`
    - Copier les valeurs de `home_type` vers `from_home_type`
    - Copier les valeurs de `surface_m2` vers `from_surface_m2`

  3. Remarques importantes
    - Les anciens champs (home_size, home_type, surface_m2) sont conservés pour compatibilité
    - Les nouveaux champs permettent de différencier les caractéristiques du logement de départ et d'arrivée
*/

-- Ajouter les nouveaux champs pour le logement de départ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'from_home_size'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN from_home_size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'from_home_type'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN from_home_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'from_surface_m2'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN from_surface_m2 numeric;
  END IF;
END $$;

-- Ajouter les nouveaux champs pour le logement d'arrivée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'to_home_size'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN to_home_size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'to_home_type'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN to_home_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'to_surface_m2'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN to_surface_m2 numeric;
  END IF;
END $$;

-- Migrer les données existantes vers les nouveaux champs de départ
UPDATE quote_requests
SET
  from_home_size = COALESCE(from_home_size, home_size),
  from_home_type = COALESCE(from_home_type, home_type),
  from_surface_m2 = COALESCE(from_surface_m2, surface_m2)
WHERE from_home_size IS NULL OR from_home_type IS NULL;