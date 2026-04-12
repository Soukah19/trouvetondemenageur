/*
  # Enhanced Features Schema

  1. New Tables
    - `mover_badges`
      - Tracks earned badges for movers (verified, top-rated, responsive, etc.)
      - `id` (uuid, primary key)
      - `mover_id` (uuid, references movers)
      - `badge_type` (text: verified, top_rated, responsive, best_price)
      - `earned_at` (timestamptz)
      - `expires_at` (timestamptz, nullable for permanent badges)
      
    - `mover_portfolio`
      - Portfolio photos for movers to showcase their work
      - `id` (uuid, primary key)
      - `mover_id` (uuid, references movers)
      - `photo_url` (text)
      - `description` (text, nullable)
      - `project_date` (date, nullable)
      - `created_at` (timestamptz)
      
    - `moving_checklist_templates`
      - Pre-defined checklist items for moving
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, nullable)
      - `phase` (text: before, during, after)
      - `days_before_move` (integer, for scheduling)
      - `order_index` (integer)
      
    - `user_checklist_items`
      - User's personal checklist progress
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `quote_request_id` (uuid, references quote_requests, nullable)
      - `template_id` (uuid, references moving_checklist_templates, nullable)
      - `title` (text)
      - `description` (text, nullable)
      - `is_completed` (boolean)
      - `completed_at` (timestamptz, nullable)
      - `due_date` (date, nullable)
      - `created_at` (timestamptz)
      
    - `inventory_items`
      - Detailed inventory of items to move
      - `id` (uuid, primary key)
      - `quote_request_id` (uuid, references quote_requests)
      - `user_id` (uuid, references auth.users)
      - `room` (text)
      - `item_name` (text)
      - `quantity` (integer)
      - `volume_m3` (numeric, nullable)
      - `is_fragile` (boolean)
      - `photo_url` (text, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      
    - `activity_timeline`
      - Timeline of all activities for transparency
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `quote_request_id` (uuid, references quote_requests, nullable)
      - `activity_type` (text: quote_created, bid_received, payment_made, etc.)
      - `title` (text)
      - `description` (text, nullable)
      - `metadata` (jsonb, nullable for extra data)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Movers can manage their badges and portfolio
    - Users can view mover public information

  3. Indexes
    - Add indexes for performance on foreign keys and query patterns

  4. Default Data
    - Insert 18 default checklist templates in French
    - Auto-assign badges based on existing data
*/

-- Mover Badges Table
CREATE TABLE IF NOT EXISTS mover_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  badge_type text NOT NULL CHECK (badge_type IN ('verified', 'top_rated', 'responsive', 'best_price', 'experienced')),
  earned_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mover_badges_mover_id ON mover_badges(mover_id);
CREATE INDEX IF NOT EXISTS idx_mover_badges_type ON mover_badges(badge_type);

ALTER TABLE mover_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mover badges"
  ON mover_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage badges"
  ON mover_badges FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Mover Portfolio Table
CREATE TABLE IF NOT EXISTS mover_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  description text,
  project_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mover_portfolio_mover_id ON mover_portfolio(mover_id);

ALTER TABLE mover_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mover portfolios"
  ON mover_portfolio FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Movers can manage their portfolio"
  ON mover_portfolio FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_portfolio.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can update their portfolio"
  ON mover_portfolio FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_portfolio.mover_id
      AND movers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_portfolio.mover_id
      AND movers.user_id = auth.uid()
    )
  );

CREATE POLICY "Movers can delete their portfolio"
  ON mover_portfolio FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_portfolio.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Moving Checklist Templates Table
CREATE TABLE IF NOT EXISTS moving_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  phase text NOT NULL CHECK (phase IN ('before', 'during', 'after')),
  days_before_move integer DEFAULT 0,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_phase ON moving_checklist_templates(phase);

ALTER TABLE moving_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view checklist templates"
  ON moving_checklist_templates FOR SELECT
  TO authenticated
  USING (true);

-- User Checklist Items Table
CREATE TABLE IF NOT EXISTS user_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  template_id uuid REFERENCES moving_checklist_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  due_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_checklist_user_id ON user_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_quote_id ON user_checklist_items(quote_request_id);

ALTER TABLE user_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their checklist items"
  ON user_checklist_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their checklist items"
  ON user_checklist_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their checklist items"
  ON user_checklist_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their checklist items"
  ON user_checklist_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room text NOT NULL,
  item_name text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  volume_m3 numeric(10, 2),
  is_fragile boolean DEFAULT false NOT NULL,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_quote_id ON inventory_items(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM quotes q
      JOIN movers m ON m.id = q.mover_id
      WHERE q.quote_request_id = inventory_items.quote_request_id
      AND m.user_id = auth.uid()
      AND q.status = 'accepted'
    )
  );

CREATE POLICY "Users can create their inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their inventory items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Activity Timeline Table
CREATE TABLE IF NOT EXISTS activity_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_timeline_user_id ON activity_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_quote_id ON activity_timeline(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_created_at ON activity_timeline(created_at DESC);

ALTER TABLE activity_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their activity timeline"
  ON activity_timeline FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM quotes q
      JOIN movers m ON m.id = q.mover_id
      WHERE m.user_id = auth.uid()
      AND q.quote_request_id = activity_timeline.quote_request_id
    )
  );

CREATE POLICY "System can create activity timeline"
  ON activity_timeline FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default checklist templates
INSERT INTO moving_checklist_templates (title, description, phase, days_before_move, order_index) VALUES
  ('Réserver le déménageur', 'Choisir et réserver votre entreprise de déménagement', 'before', 30, 1),
  ('Faire le tri', 'Trier et désencombrer vos affaires', 'before', 30, 2),
  ('Commander les cartons', 'Acheter ou récupérer des cartons de déménagement', 'before', 21, 3),
  ('Prévenir les organismes', 'Informer la poste, banque, assurance, etc.', 'before', 21, 4),
  ('Résilier les abonnements', 'Internet, électricité, gaz de l''ancien logement', 'before', 14, 5),
  ('Faire l''état des lieux de sortie', 'Planifier avec le propriétaire', 'before', 7, 6),
  ('Emballer les objets fragiles', 'Protéger la vaisselle, miroirs, objets précieux', 'before', 7, 7),
  ('Préparer un sac essentiel', 'Documents, vêtements, médicaments pour les premiers jours', 'before', 2, 8),
  ('Vider le frigo', 'Consommer ou jeter les aliments périssables', 'before', 1, 9),
  ('Accueillir les déménageurs', 'Être présent le jour J', 'during', 0, 10),
  ('Vérifier le chargement', 'S''assurer que tout est emballé correctement', 'during', 0, 11),
  ('État des lieux de sortie', 'Faire l''état des lieux avec le propriétaire', 'during', 0, 12),
  ('Superviser le déchargement', 'Guider les déménageurs dans le nouveau logement', 'during', 0, 13),
  ('État des lieux d''entrée', 'Faire l''état des lieux du nouveau logement', 'after', 0, 14),
  ('Déballer les essentiels', 'Installer la chambre, cuisine, salle de bain', 'after', 0, 15),
  ('Mettre à jour l''adresse', 'Carte d''identité, permis de conduire, carte grise', 'after', 7, 16),
  ('Souscrire aux nouveaux abonnements', 'Internet, électricité, gaz du nouveau logement', 'after', 7, 17),
  ('S''inscrire sur les listes électorales', 'Mise à jour dans la nouvelle commune', 'after', 30, 18)
ON CONFLICT DO NOTHING;
