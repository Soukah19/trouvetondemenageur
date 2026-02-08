/*
  # Add Ratings and Reviews System

  ## Summary
  This migration adds a comprehensive ratings and reviews system where clients can rate and review movers after completed moves.

  ## New Tables
  
  ### `reviews`
  - `id` (uuid, primary key) - Unique review identifier
  - `quote_id` (uuid, foreign key) - Links to the accepted quote
  - `quote_request_id` (uuid, foreign key) - Links to the quote request
  - `client_id` (uuid, foreign key) - Client who wrote the review
  - `mover_id` (uuid, foreign key) - Mover being reviewed
  - `rating` (integer) - Star rating 1-5
  - `punctuality_rating` (integer) - Punctuality rating 1-5
  - `professionalism_rating` (integer) - Professionalism rating 1-5
  - `care_rating` (integer) - Care of items rating 1-5
  - `value_rating` (integer) - Value for money rating 1-5
  - `comment` (text) - Written review
  - `would_recommend` (boolean) - Would recommend to others
  - `mover_response` (text) - Mover's response to review
  - `mover_response_date` (timestamptz) - When mover responded
  - `is_verified` (boolean) - Review verified by admin
  - `is_public` (boolean) - Show publicly on mover profile
  - `created_at` (timestamptz) - Review timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Updates to Existing Tables
  
  ### `movers` table - Add rating statistics
  - `average_rating` (numeric) - Overall average rating
  - `total_reviews` (integer) - Total number of reviews
  - `punctuality_avg` (numeric) - Average punctuality rating
  - `professionalism_avg` (numeric) - Average professionalism rating
  - `care_avg` (numeric) - Average care rating
  - `value_avg` (numeric) - Average value rating
  - `recommendation_rate` (numeric) - Percentage who would recommend

  ## Security
  - Enable RLS on reviews table
  - Clients can only review their own completed moves
  - One review per quote (enforced by unique constraint)
  - Movers can respond to reviews about them
  - Public reviews visible to all
  - Admins can verify/moderate reviews

  ## Performance
  - Index on mover_id for profile page queries
  - Index on client_id for user's review history
  - Index on quote_id for checking if reviewed
  - Index on rating for filtering/sorting
  - Index on is_public for public display
*/

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE NOT NULL UNIQUE,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  punctuality_rating integer NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  professionalism_rating integer NOT NULL CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  care_rating integer NOT NULL CHECK (care_rating >= 1 AND care_rating <= 5),
  value_rating integer NOT NULL CHECK (value_rating >= 1 AND value_rating <= 5),
  comment text,
  would_recommend boolean DEFAULT true,
  mover_response text,
  mover_response_date timestamptz,
  is_verified boolean DEFAULT false,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add rating columns to movers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE movers ADD COLUMN average_rating numeric CHECK (average_rating >= 0 AND average_rating <= 5) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'total_reviews'
  ) THEN
    ALTER TABLE movers ADD COLUMN total_reviews integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'punctuality_avg'
  ) THEN
    ALTER TABLE movers ADD COLUMN punctuality_avg numeric CHECK (punctuality_avg >= 0 AND punctuality_avg <= 5) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'professionalism_avg'
  ) THEN
    ALTER TABLE movers ADD COLUMN professionalism_avg numeric CHECK (professionalism_avg >= 0 AND professionalism_avg <= 5) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'care_avg'
  ) THEN
    ALTER TABLE movers ADD COLUMN care_avg numeric CHECK (care_avg >= 0 AND care_avg <= 5) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'value_avg'
  ) THEN
    ALTER TABLE movers ADD COLUMN value_avg numeric CHECK (value_avg >= 0 AND value_avg <= 5) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'recommendation_rate'
  ) THEN
    ALTER TABLE movers ADD COLUMN recommendation_rate numeric CHECK (recommendation_rate >= 0 AND recommendation_rate <= 100) DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews

-- Anyone can view public reviews
CREATE POLICY "Anyone can view public reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Clients can view their own reviews
CREATE POLICY "Clients can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Movers can view reviews about them
CREATE POLICY "Movers can view reviews about them"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Clients can create reviews for their completed moves
CREATE POLICY "Clients can create reviews for own moves"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_id
      AND quotes.status = 'accepted'
      AND EXISTS (
        SELECT 1 FROM quote_requests
        WHERE quote_requests.id = quotes.quote_request_id
        AND quote_requests.client_user_id = auth.uid()
      )
    )
  );

-- Clients can update their own reviews
CREATE POLICY "Clients can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Movers can update reviews to add responses
CREATE POLICY "Movers can respond to reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Admins can manage all reviews
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_mover ON reviews(mover_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_quote ON reviews(quote_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reviews(is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movers_average_rating ON movers(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_movers_total_reviews ON movers(total_reviews DESC);

-- Function to update mover ratings
CREATE OR REPLACE FUNCTION update_mover_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE movers
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE mover_id = COALESCE(NEW.mover_id, OLD.mover_id)
      AND is_public = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE mover_id = COALESCE(NEW.mover_id, OLD.mover_id)
      AND is_public = true
    ),
    punctuality_avg = (
      SELECT ROUND(AVG(punctuality_rating)::numeric, 2)
      FROM reviews
      WHERE mover_id = COALESCE(NEW.mover_id, OLD.mover_id)
      AND is_public = true
    ),
    professionalism_avg = (
      SELECT ROUND(AVG(professionalism_rating)::numeric, 2)
      FROM reviews
      WHERE mover_id = COALESCE(NEW.mover_id, OLD.mover_id)
      AND is_public = true
    ),
    care_avg = (
      SELECT ROUND(AVG(care_rating)::numeric, 2)
      FROM reviews
      WHERE mover_id = COALESCE(NEW.mover_id, OLD.mover_id)
      AND is_public = true
    ),
    value_avg = (
      SELECT ROUND(AVG(value_rating)::numeric, 2)
      FROM reviews
      WHERE mover_id = COALESCE(NEW.mover_id, OLD.mover_id)
      AND is_public = true
    ),
    recommendation_rate = (
      SELECT ROUND((COUNT(*) FILTER (WHERE would_recommend = true)::numeric / NULLIF(COUNT(*), 0) * 100), 2)
      FROM reviews
      WHERE mover_id = COALESCE(NEW.mover_id, OLD.mover_id)
      AND is_public = true
    )
  WHERE id = COALESCE(NEW.mover_id, OLD.mover_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update mover ratings
DROP TRIGGER IF EXISTS trigger_update_mover_ratings ON reviews;
CREATE TRIGGER trigger_update_mover_ratings
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_mover_ratings();
