CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  export_password TEXT DEFAULT 'Adminttd@Heikel',
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON platform_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);


ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();