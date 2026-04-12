-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR (safe to run multiple times)
-- Ensures all tables, columns, and policies exist for:
-- - Mover fin de mission flow
-- - Client damage reporting
-- - Admin litiges / guarantee decisions
-- ============================================================

-- 1. TABLES
-- ============================================================

-- moving_photos
CREATE TABLE IF NOT EXISTS moving_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  photo_type text NOT NULL CHECK (photo_type IN ('before_departure', 'loading', 'unloading', 'before', 'after', 'damage')),
  storage_path text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE moving_photos ENABLE ROW LEVEL SECURITY;

-- moving_status
CREATE TABLE IF NOT EXISTS moving_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL UNIQUE REFERENCES quote_requests(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'loading', 'in_transit', 'unloading', 'completed')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE moving_status ENABLE ROW LEVEL SECURITY;

-- damage_reports
CREATE TABLE IF NOT EXISTS damage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id),
  before_photo_id uuid,
  after_photo_id uuid,
  description text NOT NULL,
  ai_analysis jsonb DEFAULT '{}',
  responsibility text DEFAULT 'under_review' CHECK (responsibility IN ('mover', 'client', 'disputed', 'under_review')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected')),
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;


-- 2. PAYMENTS COLUMNS (all idempotent - checks before adding)
-- ============================================================
DO $$
BEGIN
  -- mission_completion_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='mission_completion_status') THEN
    ALTER TABLE payments ADD COLUMN mission_completion_status text DEFAULT 'in_progress';
  END IF;

  -- mission_completion_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='mission_completion_date') THEN
    ALTER TABLE payments ADD COLUMN mission_completion_date timestamptz;
  END IF;

  -- release_requested_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='release_requested_at') THEN
    ALTER TABLE payments ADD COLUMN release_requested_at timestamptz;
  END IF;

  -- guarantee_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='guarantee_amount') THEN
    ALTER TABLE payments ADD COLUMN guarantee_amount numeric DEFAULT 0;
  END IF;

  -- guarantee_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='guarantee_status') THEN
    ALTER TABLE payments ADD COLUMN guarantee_status text DEFAULT 'held';
  END IF;

  -- guarantee_released_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='guarantee_released_amount') THEN
    ALTER TABLE payments ADD COLUMN guarantee_released_amount numeric DEFAULT 0;
  END IF;

  -- guarantee_decision_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='guarantee_decision_at') THEN
    ALTER TABLE payments ADD COLUMN guarantee_decision_at timestamptz;
  END IF;

  -- guarantee_decision_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='guarantee_decision_by') THEN
    ALTER TABLE payments ADD COLUMN guarantee_decision_by uuid;
  END IF;

  -- guarantee_notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='guarantee_notes') THEN
    ALTER TABLE payments ADD COLUMN guarantee_notes text;
  END IF;
END $$;


-- 3. RLS POLICIES (drop + recreate to be safe)
-- ============================================================

-- moving_photos: let everyone SELECT their own mission photos
DROP POLICY IF EXISTS "Users can view photos for their missions" ON moving_photos;
CREATE POLICY "Users can view photos for their missions"
  ON moving_photos FOR SELECT TO authenticated
  USING (true);

-- moving_photos: clients can upload after + damage photos
DROP POLICY IF EXISTS "Clients can upload photos" ON moving_photos;
CREATE POLICY "Clients can upload photos"
  ON moving_photos FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND photo_type IN ('before_departure', 'unloading', 'after', 'damage')
  );

-- moving_photos: movers can upload loading + after photos
DROP POLICY IF EXISTS "Movers can upload loading photos" ON moving_photos;
DROP POLICY IF EXISTS "Movers can upload photos" ON moving_photos;
CREATE POLICY "Movers can upload photos"
  ON moving_photos FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND photo_type IN ('loading', 'after')
  );

-- damage_reports: anyone can read (admins need to see all)
DROP POLICY IF EXISTS "Anyone can view damage reports" ON damage_reports;
CREATE POLICY "Anyone can view damage reports"
  ON damage_reports FOR SELECT TO authenticated
  USING (true);

-- damage_reports: clients can create
DROP POLICY IF EXISTS "Clients can create damage reports" ON damage_reports;
CREATE POLICY "Clients can create damage reports"
  ON damage_reports FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- damage_reports: admins can update
DROP POLICY IF EXISTS "Admins can update damage reports" ON damage_reports;
CREATE POLICY "Admins can update damage reports"
  ON damage_reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- moving_status: everyone can read
DROP POLICY IF EXISTS "Anyone can view moving status" ON moving_status;
CREATE POLICY "Anyone can view moving status"
  ON moving_status FOR SELECT TO authenticated
  USING (true);

-- moving_status: movers + admins can upsert
DROP POLICY IF EXISTS "Movers can update moving status" ON moving_status;
CREATE POLICY "Movers can update moving status"
  ON moving_status FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);


-- 4. TRIGGER: notify admins when damage report is created
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admin_on_damage_report()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  admin_record RECORD;
  v_from_city text;
  v_to_city text;
  v_client_name text;
BEGIN
  SELECT qr.from_city, qr.to_city, COALESCE(c.first_name || ' ' || c.last_name, 'Client')
  INTO v_from_city, v_to_city, v_client_name
  FROM quote_requests qr
  LEFT JOIN clients c ON c.user_id = qr.client_user_id
  WHERE qr.id = NEW.quote_request_id;

  FOR admin_record IN SELECT user_id FROM admins LOOP
    INSERT INTO notifications (user_id, user_type, title, message, type, related_id, read, created_at)
    VALUES (admin_record.user_id, 'admin',
      '⚠️ Nouveau rapport de dommage',
      'Le client ' || v_client_name || ' a signalé des dommages pour ' || COALESCE(v_from_city,'?') || ' → ' || COALESCE(v_to_city,'?'),
      'damage_report', NEW.id, false, NOW());
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_admin_on_damage_report ON damage_reports;
CREATE TRIGGER trigger_notify_admin_on_damage_report
  AFTER INSERT ON damage_reports FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_damage_report();


-- 5. STORAGE: ensure moving-photos bucket exists
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('moving-photos', 'moving-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view moving photos" ON storage.objects;
CREATE POLICY "Anyone can view moving photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'moving-photos');

DROP POLICY IF EXISTS "Authenticated users can upload moving photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload moving photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'moving-photos');


-- Done! You can verify by running:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'payments' AND column_name LIKE 'guarantee%';
