/*
  # Photo System and Damage Tracking

  This migration implements the AI photo comparison system for tracking damages during moves.

  ## New Tables

  ### `moving_photos`
  Stores all photos taken during the moving process
  - `id` (uuid, primary key)
  - `quote_request_id` (uuid, foreign key to quote_requests)
  - `uploaded_by` (uuid, foreign key to auth.users)
  - `photo_type` (text) - 'before_departure', 'loading', 'unloading'
  - `storage_path` (text) - Path in Supabase Storage
  - `metadata` (jsonb) - Additional data (location, timestamp, etc.)
  - `created_at` (timestamptz)

  ### `damage_reports`
  Records of reported damages with AI analysis
  - `id` (uuid, primary key)
  - `quote_request_id` (uuid, foreign key to quote_requests)
  - `reported_by` (uuid, foreign key to auth.users)
  - `before_photo_id` (uuid, nullable, foreign key to moving_photos)
  - `after_photo_id` (uuid, nullable, foreign key to moving_photos)
  - `description` (text) - User description of damage
  - `ai_analysis` (jsonb) - AI comparison results
  - `responsibility` (text) - 'mover', 'client', 'disputed', 'under_review'
  - `status` (text) - 'pending', 'under_review', 'resolved', 'rejected'
  - `resolution_notes` (text, nullable)
  - `resolved_by` (uuid, nullable, foreign key to auth.users)
  - `resolved_at` (timestamptz, nullable)
  - `created_at` (timestamptz)

  ### `moving_status`
  Tracks the current status of each move
  - `id` (uuid, primary key)
  - `quote_request_id` (uuid, unique, foreign key to quote_requests)
  - `status` (text) - 'confirmed', 'before_photos_uploaded', 'in_transit', 'loading_photos_uploaded', 'arrived', 'unloading_photos_uploaded', 'completed'
  - `started_at` (timestamptz, nullable)
  - `loaded_at` (timestamptz, nullable)
  - `arrived_at` (timestamptz, nullable)
  - `completed_at` (timestamptz, nullable)
  - `updated_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Clients can upload before_departure and unloading photos
  - Movers can upload loading photos
  - All parties can view photos for their quote requests
  - Only clients can create damage reports
  - Admins can update damage report status and responsibility
*/

-- Create moving_photos table
CREATE TABLE IF NOT EXISTS moving_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_type text NOT NULL CHECK (photo_type IN ('before_departure', 'loading', 'unloading')),
  storage_path text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create damage_reports table
CREATE TABLE IF NOT EXISTS damage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  before_photo_id uuid REFERENCES moving_photos(id) ON DELETE SET NULL,
  after_photo_id uuid REFERENCES moving_photos(id) ON DELETE SET NULL,
  description text NOT NULL,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  responsibility text DEFAULT 'under_review' CHECK (responsibility IN ('mover', 'client', 'disputed', 'under_review')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected')),
  resolution_notes text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create moving_status table
CREATE TABLE IF NOT EXISTS moving_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid UNIQUE NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'before_photos_uploaded', 'in_transit', 'loading_photos_uploaded', 'arrived', 'unloading_photos_uploaded', 'completed')),
  started_at timestamptz,
  loaded_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_moving_photos_quote_request ON moving_photos(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_moving_photos_type ON moving_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_damage_reports_quote_request ON damage_reports(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_moving_status_quote_request ON moving_status(quote_request_id);

-- Enable RLS
ALTER TABLE moving_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moving_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moving_photos

-- Clients can view photos for their quote requests
CREATE POLICY "Clients can view photos for their quote requests"
  ON moving_photos FOR SELECT
  TO authenticated
  USING (
    quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
  );

-- Movers can view photos for quote requests they have accepted quotes on
CREATE POLICY "Movers can view photos for their accepted quotes"
  ON moving_photos FOR SELECT
  TO authenticated
  USING (
    quote_request_id IN (
      SELECT qr.id FROM quote_requests qr
      WHERE qr.accepted_quote_id IN (
        SELECT id FROM quotes WHERE mover_id IN (
          SELECT id FROM movers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Clients can upload before_departure and unloading photos
CREATE POLICY "Clients can upload before_departure and unloading photos"
  ON moving_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
    AND photo_type IN ('before_departure', 'unloading')
  );

-- Movers can upload loading photos for their accepted quotes
CREATE POLICY "Movers can upload loading photos"
  ON moving_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND quote_request_id IN (
      SELECT qr.id FROM quote_requests qr
      WHERE qr.accepted_quote_id IN (
        SELECT id FROM quotes WHERE mover_id IN (
          SELECT id FROM movers WHERE user_id = auth.uid()
        )
      )
    )
    AND photo_type = 'loading'
  );

-- Admins can view all photos
CREATE POLICY "Admins can view all photos"
  ON moving_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for damage_reports

-- Clients can view damage reports for their quote requests
CREATE POLICY "Clients can view their damage reports"
  ON damage_reports FOR SELECT
  TO authenticated
  USING (
    quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
  );

-- Movers can view damage reports for their accepted quotes
CREATE POLICY "Movers can view damage reports for their quotes"
  ON damage_reports FOR SELECT
  TO authenticated
  USING (
    quote_request_id IN (
      SELECT qr.id FROM quote_requests qr
      WHERE qr.accepted_quote_id IN (
        SELECT id FROM quotes WHERE mover_id IN (
          SELECT id FROM movers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Clients can create damage reports for their quote requests
CREATE POLICY "Clients can create damage reports"
  ON damage_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
  );

-- Admins can view all damage reports
CREATE POLICY "Admins can view all damage reports"
  ON damage_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can update damage reports
CREATE POLICY "Admins can update damage reports"
  ON damage_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for moving_status

-- Clients can view status for their quote requests
CREATE POLICY "Clients can view moving status for their quote requests"
  ON moving_status FOR SELECT
  TO authenticated
  USING (
    quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
  );

-- Movers can view status for their accepted quotes
CREATE POLICY "Movers can view moving status for their quotes"
  ON moving_status FOR SELECT
  TO authenticated
  USING (
    quote_request_id IN (
      SELECT qr.id FROM quote_requests qr
      WHERE qr.accepted_quote_id IN (
        SELECT id FROM quotes WHERE mover_id IN (
          SELECT id FROM movers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Clients can update status for their quote requests
CREATE POLICY "Clients can update moving status for their quote requests"
  ON moving_status FOR UPDATE
  TO authenticated
  USING (
    quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
  )
  WITH CHECK (
    quote_request_id IN (
      SELECT id FROM quote_requests WHERE client_user_id = auth.uid()
    )
  );

-- Movers can update status for their accepted quotes
CREATE POLICY "Movers can update moving status for their quotes"
  ON moving_status FOR UPDATE
  TO authenticated
  USING (
    quote_request_id IN (
      SELECT qr.id FROM quote_requests qr
      WHERE qr.accepted_quote_id IN (
        SELECT id FROM quotes WHERE mover_id IN (
          SELECT id FROM movers WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    quote_request_id IN (
      SELECT qr.id FROM quote_requests qr
      WHERE qr.accepted_quote_id IN (
        SELECT id FROM quotes WHERE mover_id IN (
          SELECT id FROM movers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- System can create moving status records
CREATE POLICY "Authenticated users can create moving status"
  ON moving_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can view and update all moving statuses
CREATE POLICY "Admins can view all moving statuses"
  ON moving_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all moving statuses"
  ON moving_status FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );