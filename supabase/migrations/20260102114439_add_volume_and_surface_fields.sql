/*
  # Add volume and surface fields to quote_requests

  1. Changes
    - Add `elevator_capacity_from` column (text) for elevator capacity at departure
    - Add `elevator_capacity_to` column (text) for elevator capacity at arrival
    - Add `surface_m2` column (numeric) for home surface area in square meters
    - Add `volume_m3` column (numeric) for estimated volume in cubic meters
  
  2. Notes
    - Elevator capacity options: '2-3 pers', '3-4 pers', '4-5 pers', '6+ pers'
    - Surface and volume are optional but recommended for better price estimation
    - Existing records will have NULL values for these new fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'elevator_capacity_from'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN elevator_capacity_from text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'elevator_capacity_to'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN elevator_capacity_to text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'surface_m2'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN surface_m2 numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'volume_m3'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN volume_m3 numeric;
  END IF;
END $$;
