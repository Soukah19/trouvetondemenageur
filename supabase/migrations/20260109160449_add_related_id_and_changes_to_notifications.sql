/*
  # Ajout du related_id et stockage des changements pour les notifications
  
  1. Modifications
    - Ajoute related_id dans les notifications (pour rediriger vers la bonne demande)
    - Crée une table pour stocker l'historique des changements de demandes
    - Permet de comparer l'ancien et le nouveau pour afficher en rouge
  
  2. Tables
    - quote_request_changes: Historique des modifications de demandes
*/

-- Table pour stocker l'historique des modifications
CREATE TABLE IF NOT EXISTS quote_request_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  changed_fields jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_quote_request_changes_quote_request_id 
  ON quote_request_changes(quote_request_id);

CREATE INDEX IF NOT EXISTS idx_quote_request_changes_changed_at 
  ON quote_request_changes(changed_at DESC);

-- RLS pour la table quote_request_changes
ALTER TABLE quote_request_changes ENABLE ROW LEVEL SECURITY;

-- Les déménageurs peuvent voir les changements des demandes pour lesquelles ils ont soumis un devis
CREATE POLICY "Movers can view changes for their quotes"
  ON quote_request_changes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers m
      JOIN quotes q ON q.mover_id = m.id
      WHERE m.user_id = auth.uid()
      AND q.quote_request_id = quote_request_changes.quote_request_id
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all changes"
  ON quote_request_changes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Fonction mise à jour pour inclure related_id et stocker les changements
CREATE OR REPLACE FUNCTION notify_on_quote_request_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  mover_record RECORD;
  admin_record RECORD;
  changed_fields jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    
    -- Construire l'objet des champs modifiés
    IF OLD.from_address IS DISTINCT FROM NEW.from_address THEN
      changed_fields := changed_fields || jsonb_build_object('from_address', jsonb_build_object('old', OLD.from_address, 'new', NEW.from_address));
    END IF;
    IF OLD.from_city IS DISTINCT FROM NEW.from_city THEN
      changed_fields := changed_fields || jsonb_build_object('from_city', jsonb_build_object('old', OLD.from_city, 'new', NEW.from_city));
    END IF;
    IF OLD.from_postal_code IS DISTINCT FROM NEW.from_postal_code THEN
      changed_fields := changed_fields || jsonb_build_object('from_postal_code', jsonb_build_object('old', OLD.from_postal_code, 'new', NEW.from_postal_code));
    END IF;
    IF OLD.to_address IS DISTINCT FROM NEW.to_address THEN
      changed_fields := changed_fields || jsonb_build_object('to_address', jsonb_build_object('old', OLD.to_address, 'new', NEW.to_address));
    END IF;
    IF OLD.to_city IS DISTINCT FROM NEW.to_city THEN
      changed_fields := changed_fields || jsonb_build_object('to_city', jsonb_build_object('old', OLD.to_city, 'new', NEW.to_city));
    END IF;
    IF OLD.to_postal_code IS DISTINCT FROM NEW.to_postal_code THEN
      changed_fields := changed_fields || jsonb_build_object('to_postal_code', jsonb_build_object('old', OLD.to_postal_code, 'new', NEW.to_postal_code));
    END IF;
    IF OLD.moving_date IS DISTINCT FROM NEW.moving_date THEN
      changed_fields := changed_fields || jsonb_build_object('moving_date', jsonb_build_object('old', OLD.moving_date, 'new', NEW.moving_date));
    END IF;
    IF OLD.from_home_size IS DISTINCT FROM NEW.from_home_size THEN
      changed_fields := changed_fields || jsonb_build_object('from_home_size', jsonb_build_object('old', OLD.from_home_size, 'new', NEW.from_home_size));
    END IF;
    IF OLD.from_home_type IS DISTINCT FROM NEW.from_home_type THEN
      changed_fields := changed_fields || jsonb_build_object('from_home_type', jsonb_build_object('old', OLD.from_home_type, 'new', NEW.from_home_type));
    END IF;
    IF OLD.to_home_size IS DISTINCT FROM NEW.to_home_size THEN
      changed_fields := changed_fields || jsonb_build_object('to_home_size', jsonb_build_object('old', OLD.to_home_size, 'new', NEW.to_home_size));
    END IF;
    IF OLD.to_home_type IS DISTINCT FROM NEW.to_home_type THEN
      changed_fields := changed_fields || jsonb_build_object('to_home_type', jsonb_build_object('old', OLD.to_home_type, 'new', NEW.to_home_type));
    END IF;
    IF OLD.volume_m3 IS DISTINCT FROM NEW.volume_m3 THEN
      changed_fields := changed_fields || jsonb_build_object('volume_m3', jsonb_build_object('old', OLD.volume_m3, 'new', NEW.volume_m3));
    END IF;
    IF OLD.from_surface_m2 IS DISTINCT FROM NEW.from_surface_m2 THEN
      changed_fields := changed_fields || jsonb_build_object('from_surface_m2', jsonb_build_object('old', OLD.from_surface_m2, 'new', NEW.from_surface_m2));
    END IF;
    IF OLD.to_surface_m2 IS DISTINCT FROM NEW.to_surface_m2 THEN
      changed_fields := changed_fields || jsonb_build_object('to_surface_m2', jsonb_build_object('old', OLD.to_surface_m2, 'new', NEW.to_surface_m2));
    END IF;
    IF OLD.floor_from IS DISTINCT FROM NEW.floor_from THEN
      changed_fields := changed_fields || jsonb_build_object('floor_from', jsonb_build_object('old', OLD.floor_from, 'new', NEW.floor_from));
    END IF;
    IF OLD.floor_to IS DISTINCT FROM NEW.floor_to THEN
      changed_fields := changed_fields || jsonb_build_object('floor_to', jsonb_build_object('old', OLD.floor_to, 'new', NEW.floor_to));
    END IF;
    IF OLD.elevator_from IS DISTINCT FROM NEW.elevator_from THEN
      changed_fields := changed_fields || jsonb_build_object('elevator_from', jsonb_build_object('old', OLD.elevator_from, 'new', NEW.elevator_from));
    END IF;
    IF OLD.elevator_to IS DISTINCT FROM NEW.elevator_to THEN
      changed_fields := changed_fields || jsonb_build_object('elevator_to', jsonb_build_object('old', OLD.elevator_to, 'new', NEW.elevator_to));
    END IF;
    IF OLD.services_needed::text IS DISTINCT FROM NEW.services_needed::text THEN
      changed_fields := changed_fields || jsonb_build_object('services_needed', jsonb_build_object('old', OLD.services_needed, 'new', NEW.services_needed));
    END IF;
    IF OLD.furniture_lift_needed_departure IS DISTINCT FROM NEW.furniture_lift_needed_departure THEN
      changed_fields := changed_fields || jsonb_build_object('furniture_lift_needed_departure', jsonb_build_object('old', OLD.furniture_lift_needed_departure, 'new', NEW.furniture_lift_needed_departure));
    END IF;
    IF OLD.furniture_lift_needed_arrival IS DISTINCT FROM NEW.furniture_lift_needed_arrival THEN
      changed_fields := changed_fields || jsonb_build_object('furniture_lift_needed_arrival', jsonb_build_object('old', OLD.furniture_lift_needed_arrival, 'new', NEW.furniture_lift_needed_arrival));
    END IF;
    
    -- Stocker les changements dans la table d'historique
    IF changed_fields != '{}'::jsonb THEN
      INSERT INTO quote_request_changes (quote_request_id, changed_fields, changed_at)
      VALUES (NEW.id, changed_fields, NOW());
    END IF;
    
    -- Notifier les déménageurs ayant soumis un devis avec related_id
    FOR mover_record IN 
      SELECT DISTINCT m.user_id, m.company_name, m.email
      FROM quotes q
      JOIN movers m ON q.mover_id = m.id
      WHERE q.quote_request_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, user_type, title, message, type, related_id, read, created_at)
      VALUES (
        mover_record.user_id,
        'mover',
        'Demande de déménagement modifiée',
        'La demande de déménagement ' || NEW.from_city || ' → ' || NEW.to_city || ' a été modifiée. Veuillez vérifier et ajuster votre devis si nécessaire.',
        'quote_update',
        NEW.id,
        false,
        NOW()
      );
    END LOOP;
    
    -- Notifier tous les admins avec related_id
    FOR admin_record IN 
      SELECT user_id, username, email
      FROM admins
    LOOP
      INSERT INTO notifications (user_id, user_type, title, message, type, related_id, read, created_at)
      VALUES (
        admin_record.user_id,
        'admin',
        'Demande de déménagement modifiée',
        'La demande ' || NEW.from_city || ' → ' || NEW.to_city || ' a été modifiée.',
        'quote_update',
        NEW.id,
        false,
        NOW()
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;
