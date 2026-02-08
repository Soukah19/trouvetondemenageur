/*
  # TrouveTonDemenageur Database Schema

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text) - Company name
      - `description` (text) - Company description
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone
      - `address` (text) - Company address
      - `city` (text) - City
      - `postal_code` (text) - Postal code
      - `website` (text, nullable) - Company website
      - `logo_url` (text, nullable) - Company logo
      - `services` (text[]) - Array of services offered
      - `average_rating` (numeric) - Average rating
      - `total_reviews` (integer) - Total number of reviews
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `reviews`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key) - References companies
      - `user_id` (uuid, foreign key) - References auth.users
      - `rating` (integer) - Rating from 1 to 5
      - `title` (text) - Review title
      - `comment` (text) - Review content
      - `moving_date` (date, nullable) - Date of the move
      - `created_at` (timestamptz)

    - `quote_requests`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key) - References companies
      - `user_id` (uuid, nullable, foreign key) - References auth.users
      - `name` (text) - Customer name
      - `email` (text) - Customer email
      - `phone` (text) - Customer phone
      - `from_address` (text) - Origin address
      - `to_address` (text) - Destination address
      - `moving_date` (date) - Preferred moving date
      - `home_size` (text) - Size of home (studio, 1br, 2br, etc.)
      - `services_needed` (text[]) - Services requested
      - `additional_info` (text, nullable) - Additional information
      - `status` (text) - pending, contacted, quoted, accepted, rejected
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Companies: Public read access, admin write access
    - Reviews: Public read access, authenticated users can create their own
    - Quote requests: Users can create and view their own, companies can view requests sent to them
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  website text,
  logo_url text,
  services text[] DEFAULT '{}',
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text NOT NULL,
  moving_date date,
  created_at timestamptz DEFAULT now()
);

-- Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  moving_date date NOT NULL,
  home_size text NOT NULL,
  services_needed text[] DEFAULT '{}',
  additional_info text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Policies for companies
CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO public
  USING (true);

-- Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for quote_requests
CREATE POLICY "Anyone can create quote requests"
  ON quote_requests FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own quote requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_company_id ON quote_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);

-- Function to update average rating
CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companies
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
    )
  WHERE id = COALESCE(NEW.company_id, OLD.company_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating after review changes
DROP TRIGGER IF EXISTS update_rating_on_review ON reviews;
CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_company_rating();