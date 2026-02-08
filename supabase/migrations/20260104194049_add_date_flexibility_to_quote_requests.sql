/*
  # Ajouter la flexibilité de dates aux demandes de devis

  1. Modifications
    - Ajouter le champ `date_flexibility_days` à la table `quote_requests`
      - Type: integer (nombre de jours de flexibilité)
      - Par défaut: 0 (pas de flexibilité)
      - Permet au client d'indiquer combien de jours avant/après la date souhaitée il est flexible

  2. Notes
    - 0 = date fixe uniquement
    - 1-3 = flexibilité de quelques jours
    - 7 = flexibilité d'une semaine
    - 14+ = grande flexibilité
*/

-- Ajouter le champ de flexibilité de dates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'date_flexibility_days'
  ) THEN
    ALTER TABLE quote_requests 
    ADD COLUMN date_flexibility_days integer DEFAULT 0 CHECK (date_flexibility_days >= 0);
  END IF;
END $$;