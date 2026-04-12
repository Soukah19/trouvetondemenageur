/*
  # Add Mover Availability Calendar System

  1. New Tables
    - `mover_unavailability`
      - `id` (uuid, primary key)
      - `mover_id` (uuid, references movers)
      - `start_date` (date, start of unavailability)
      - `end_date` (date, end of unavailability)
      - `reason` (text, optional reason for unavailability)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `mover_unavailability` table
    - Add policies for movers to manage their own availability
    - Add policies for clients to view mover availability

  3. Indexes
    - Index on mover_id and dates for fast lookups
*/

-- Create mover_unavailability table
CREATE TABLE IF NOT EXISTS mover_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE mover_unavailability ENABLE ROW LEVEL SECURITY;

-- Policies for mover_unavailability

-- Movers can view their own unavailability
CREATE POLICY "Movers can view own unavailability"
  ON mover_unavailability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Movers can insert their own unavailability
CREATE POLICY "Movers can insert own unavailability"
  ON mover_unavailability FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Movers can update their own unavailability
CREATE POLICY "Movers can update own unavailability"
  ON mover_unavailability FOR UPDATE
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

-- Movers can delete their own unavailability
CREATE POLICY "Movers can delete own unavailability"
  ON mover_unavailability FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Clients can view mover unavailability (to see when movers are available)
CREATE POLICY "Clients can view mover unavailability"
  ON mover_unavailability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.verification_status = 'verified'
      AND movers.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mover_unavailability_mover_id ON mover_unavailability(mover_id);
CREATE INDEX IF NOT EXISTS idx_mover_unavailability_dates ON mover_unavailability(start_date, end_date);

-- Function to check if a mover is available on a given date
CREATE OR REPLACE FUNCTION is_mover_available(p_mover_id uuid, p_date date)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unavailable_count integer;
BEGIN
  SELECT COUNT(*) INTO v_unavailable_count
  FROM mover_unavailability
  WHERE mover_id = p_mover_id
  AND p_date BETWEEN start_date AND end_date;
  
  RETURN v_unavailable_count = 0;
END;
$$;