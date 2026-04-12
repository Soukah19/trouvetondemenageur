/*
  # Add Favorites System for Clients

  1. New Tables
    - `favorites`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references auth.users)
      - `mover_id` (uuid, references movers)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `favorites` table
    - Add policies for clients to manage their own favorites

  3. Constraints
    - Unique constraint on client_id + mover_id to prevent duplicates

  4. Indexes
    - Index on client_id for fast lookups
    - Index on mover_id for aggregations
*/

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_favorite UNIQUE (client_id, mover_id)
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policies for favorites

-- Clients can view their own favorites
CREATE POLICY "Clients can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Clients can add favorites
CREATE POLICY "Clients can add favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Clients can remove their own favorites
CREATE POLICY "Clients can remove own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = client_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_favorites_mover_id ON favorites(mover_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);