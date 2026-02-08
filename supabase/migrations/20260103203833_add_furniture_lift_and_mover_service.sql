/*
  # Add Furniture Lift and Mover Services Enhancement
  
  1. Changes to quote_requests table
    - Add `furniture_lift_needed_departure` (boolean) - If client needs furniture lift at departure
    - Add `furniture_lift_needed_arrival` (boolean) - If client needs furniture lift at arrival
  
  2. Changes to movers table
    - Add `has_furniture_lift` (boolean) - If mover has furniture lift equipment
  
  3. Security
    - No RLS changes needed - existing policies apply
*/

-- Add furniture lift fields to quote_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'furniture_lift_needed_departure'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN furniture_lift_needed_departure boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'furniture_lift_needed_arrival'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN furniture_lift_needed_arrival boolean DEFAULT false;
  END IF;
END $$;

-- Add furniture lift service to movers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'has_furniture_lift'
  ) THEN
    ALTER TABLE movers ADD COLUMN has_furniture_lift boolean DEFAULT false;
  END IF;
END $$;
