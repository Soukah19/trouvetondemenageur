/*
  # Add Detailed Mover Profiles

  1. Updates to Existing Tables
    - `movers` table - Add detailed profile fields
      - `description` (text) - Company description
      - `years_experience` (integer) - Years of experience
      - `team_size` (integer) - Number of team members
      - `insurance_number` (text) - Insurance certificate number
      - `certifications` (jsonb) - Array of certifications
      - `service_areas` (jsonb) - Array of service areas/cities
      - `portfolio_images` (jsonb) - Array of portfolio image URLs
      - `specialties` (jsonb) - Array of specialties
      - `average_rating` (numeric) - Calculated average rating
      - `total_reviews` (integer) - Total number of reviews
      - `completed_moves` (integer) - Number of completed moves

  2. Indexes
    - Index on average_rating for sorting
    - Index on service_areas for searching

  3. Function
    - Function to update average rating when reviews are added
*/

-- Add columns to movers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'description'
  ) THEN
    ALTER TABLE movers ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE movers ADD COLUMN years_experience integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'team_size'
  ) THEN
    ALTER TABLE movers ADD COLUMN team_size integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'insurance_number'
  ) THEN
    ALTER TABLE movers ADD COLUMN insurance_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE movers ADD COLUMN certifications jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'service_areas'
  ) THEN
    ALTER TABLE movers ADD COLUMN service_areas jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'portfolio_images'
  ) THEN
    ALTER TABLE movers ADD COLUMN portfolio_images jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE movers ADD COLUMN specialties jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE movers ADD COLUMN average_rating numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'total_reviews'
  ) THEN
    ALTER TABLE movers ADD COLUMN total_reviews integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'completed_moves'
  ) THEN
    ALTER TABLE movers ADD COLUMN completed_moves integer DEFAULT 0;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_movers_average_rating ON movers(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_movers_service_areas ON movers USING GIN(service_areas);

-- Function to update mover rating when review is added or updated
CREATE OR REPLACE FUNCTION update_mover_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating numeric;
  v_total_reviews integer;
BEGIN
  -- Calculate new average rating
  SELECT AVG(rating), COUNT(*) INTO v_avg_rating, v_total_reviews
  FROM reviews
  WHERE mover_id = COALESCE(NEW.mover_id, OLD.mover_id);
  
  -- Update mover record
  UPDATE movers
  SET 
    average_rating = COALESCE(v_avg_rating, 0),
    total_reviews = v_total_reviews
  WHERE id = COALESCE(NEW.mover_id, OLD.mover_id);
  
  RETURN NEW;
END;
$$;

-- Create triggers for updating ratings
DROP TRIGGER IF EXISTS trigger_update_mover_rating_insert ON reviews;
CREATE TRIGGER trigger_update_mover_rating_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_mover_rating();

DROP TRIGGER IF EXISTS trigger_update_mover_rating_update ON reviews;
CREATE TRIGGER trigger_update_mover_rating_update
AFTER UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_mover_rating();

DROP TRIGGER IF EXISTS trigger_update_mover_rating_delete ON reviews;
CREATE TRIGGER trigger_update_mover_rating_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_mover_rating();

-- Function to increment completed moves count
CREATE OR REPLACE FUNCTION increment_completed_moves()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a quote is marked as completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE movers
    SET completed_moves = completed_moves + 1
    WHERE id IN (
      SELECT mover_id
      FROM quotes
      WHERE id = NEW.accepted_quote_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for incrementing completed moves
DROP TRIGGER IF EXISTS trigger_increment_completed_moves ON quote_requests;
CREATE TRIGGER trigger_increment_completed_moves
AFTER UPDATE ON quote_requests
FOR EACH ROW
EXECUTE FUNCTION increment_completed_moves();