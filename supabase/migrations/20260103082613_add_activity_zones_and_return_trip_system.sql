/*
  # Add Activity Zones and Return Trip Notification System

  1. Schema Changes
    - Add activity zones fields to `movers` table:
      - `activity_departments` (text[]) - List of department codes (e.g., ['75', '92', '93'])
      - `coverage_type` (text) - Type of coverage: 'departments', 'all_france', 'custom'
      - `preferred_zones` (text[]) - Preferred zones/cities
      - `max_distance_km` (integer) - Maximum distance willing to travel (optional)
      - `email_notifications_enabled` (boolean) - Enable email notifications for new quotes
      - `return_trip_alerts_enabled` (boolean) - Enable return trip alerts

  2. New Tables
    - `accepted_moves` - Track accepted/reserved moves for return trip detection
      - `id` (uuid, primary key)
      - `mover_id` (uuid, references movers)
      - `quote_request_id` (uuid, references quote_requests)
      - `departure_city` (text)
      - `departure_postal_code` (text)
      - `arrival_city` (text)
      - `arrival_postal_code` (text)
      - `moving_date` (date)
      - `estimated_arrival_date` (date)
      - `distance_km` (integer)
      - `status` (text) - 'scheduled', 'completed', 'cancelled'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `notification_queue` - Queue for notifications to be sent
      - `id` (uuid, primary key)
      - `mover_id` (uuid, references movers)
      - `quote_request_id` (uuid, references quote_requests)
      - `notification_type` (text) - 'new_quote', 'return_trip', 'activity_zone'
      - `sent` (boolean)
      - `sent_at` (timestamptz)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on new tables
    - Add policies for movers to manage their own data
*/

-- Add activity zones fields to movers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'activity_departments'
  ) THEN
    ALTER TABLE movers ADD COLUMN activity_departments text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'coverage_type'
  ) THEN
    ALTER TABLE movers ADD COLUMN coverage_type text DEFAULT 'departments' CHECK (coverage_type IN ('departments', 'all_france', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'preferred_zones'
  ) THEN
    ALTER TABLE movers ADD COLUMN preferred_zones text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'max_distance_km'
  ) THEN
    ALTER TABLE movers ADD COLUMN max_distance_km integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE movers ADD COLUMN email_notifications_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'return_trip_alerts_enabled'
  ) THEN
    ALTER TABLE movers ADD COLUMN return_trip_alerts_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Create accepted_moves table
CREATE TABLE IF NOT EXISTS accepted_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  departure_city text NOT NULL,
  departure_postal_code text NOT NULL,
  arrival_city text NOT NULL,
  arrival_postal_code text NOT NULL,
  moving_date date NOT NULL,
  estimated_arrival_date date NOT NULL,
  distance_km integer,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('new_quote', 'return_trip', 'activity_zone')),
  sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE accepted_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Policies for accepted_moves
CREATE POLICY "Movers can view own accepted moves"
  ON accepted_moves FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = accepted_moves.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can insert own accepted moves"
  ON accepted_moves FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = accepted_moves.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can update own accepted moves"
  ON accepted_moves FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = accepted_moves.mover_id
      AND movers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = accepted_moves.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can delete own accepted moves"
  ON accepted_moves FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = accepted_moves.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Policies for notification_queue
CREATE POLICY "Movers can view own notifications"
  ON notification_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = notification_queue.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert notifications"
  ON notification_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update notifications"
  ON notification_queue FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accepted_moves_mover_id ON accepted_moves(mover_id);
CREATE INDEX IF NOT EXISTS idx_accepted_moves_status ON accepted_moves(status);
CREATE INDEX IF NOT EXISTS idx_accepted_moves_arrival_city ON accepted_moves(arrival_city);
CREATE INDEX IF NOT EXISTS idx_accepted_moves_estimated_arrival_date ON accepted_moves(estimated_arrival_date);
CREATE INDEX IF NOT EXISTS idx_notification_queue_mover_id ON notification_queue(mover_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_sent ON notification_queue(sent);
CREATE INDEX IF NOT EXISTS idx_quote_requests_from_city ON quote_requests(from_city);
CREATE INDEX IF NOT EXISTS idx_quote_requests_from_postal_code ON quote_requests(from_postal_code);

-- Create function to automatically add accepted moves when a payment is made
CREATE OR REPLACE FUNCTION create_accepted_move_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_mover_id uuid;
  v_quote_request quote_requests;
  v_distance_km integer;
  v_estimated_arrival date;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT mover_id INTO v_mover_id
    FROM quotes
    WHERE id = NEW.quote_id;

    SELECT * INTO v_quote_request
    FROM quote_requests
    WHERE id = NEW.quote_request_id;

    v_distance_km := 0;
    
    v_estimated_arrival := v_quote_request.moving_date;
    IF v_distance_km > 500 THEN
      v_estimated_arrival := v_quote_request.moving_date + INTERVAL '2 days';
    ELSE
      v_estimated_arrival := v_quote_request.moving_date + INTERVAL '1 day';
    END IF;

    INSERT INTO accepted_moves (
      mover_id,
      quote_request_id,
      departure_city,
      departure_postal_code,
      arrival_city,
      arrival_postal_code,
      moving_date,
      estimated_arrival_date,
      distance_km,
      status
    ) VALUES (
      v_mover_id,
      NEW.quote_request_id,
      v_quote_request.from_city,
      v_quote_request.from_postal_code,
      v_quote_request.to_city,
      v_quote_request.to_postal_code,
      v_quote_request.moving_date,
      v_estimated_arrival,
      v_distance_km,
      'scheduled'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic accepted move creation
DROP TRIGGER IF EXISTS trigger_create_accepted_move ON payments;
CREATE TRIGGER trigger_create_accepted_move
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION create_accepted_move_on_payment();

-- Create function to detect return trip opportunities
CREATE OR REPLACE FUNCTION detect_return_trip_opportunities()
RETURNS TRIGGER AS $$
DECLARE
  v_mover RECORD;
BEGIN
  FOR v_mover IN
    SELECT DISTINCT m.id, m.user_id, m.email_notifications_enabled, m.return_trip_alerts_enabled
    FROM movers m
    INNER JOIN accepted_moves am ON am.mover_id = m.id
    WHERE am.status = 'scheduled'
    AND am.arrival_city = NEW.from_city
    AND am.estimated_arrival_date BETWEEN (NEW.moving_date - INTERVAL '3 days') AND (NEW.moving_date + INTERVAL '1 day')
    AND m.return_trip_alerts_enabled = true
    AND m.verification_status = 'verified'
  LOOP
    INSERT INTO notification_queue (mover_id, quote_request_id, notification_type)
    VALUES (v_mover.id, NEW.id, 'return_trip')
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for return trip detection
DROP TRIGGER IF EXISTS trigger_detect_return_trip ON quote_requests;
CREATE TRIGGER trigger_detect_return_trip
  AFTER INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION detect_return_trip_opportunities();

-- Create function to detect activity zone matches
CREATE OR REPLACE FUNCTION detect_activity_zone_matches()
RETURNS TRIGGER AS $$
DECLARE
  v_mover RECORD;
  v_from_dept text;
  v_to_dept text;
BEGIN
  v_from_dept := LEFT(NEW.from_postal_code, 2);
  v_to_dept := LEFT(NEW.to_postal_code, 2);

  FOR v_mover IN
    SELECT id, user_id, email_notifications_enabled, coverage_type, activity_departments
    FROM movers
    WHERE verification_status = 'verified'
    AND email_notifications_enabled = true
    AND (
      coverage_type = 'all_france'
      OR (coverage_type = 'departments' AND (v_from_dept = ANY(activity_departments) OR v_to_dept = ANY(activity_departments)))
    )
  LOOP
    INSERT INTO notification_queue (mover_id, quote_request_id, notification_type)
    VALUES (v_mover.id, NEW.id, 'activity_zone')
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for activity zone detection
DROP TRIGGER IF EXISTS trigger_detect_activity_zone ON quote_requests;
CREATE TRIGGER trigger_detect_activity_zone
  AFTER INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION detect_activity_zone_matches();
