-- Ajouter les colonnes de coordonnées géographiques à quote_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'from_latitude'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN from_latitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'from_longitude'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN from_longitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'to_latitude'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN to_latitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'to_longitude'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN to_longitude numeric(10, 7);
  END IF;
END $$;

-- Index pour améliorer les performances des requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_quote_requests_to_coords ON quote_requests(to_latitude, to_longitude);
CREATE INDEX IF NOT EXISTS idx_quote_requests_from_coords ON quote_requests(from_latitude, from_longitude);

-- Fonction pour calculer la distance entre deux points géographiques (en km)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
)
RETURNS numeric AS $$
DECLARE
  earth_radius numeric := 6371;
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);

  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour notifier les déménageurs avec des missions proches
CREATE OR REPLACE FUNCTION notify_movers_with_nearby_missions()
RETURNS TRIGGER AS $$
DECLARE
  v_mover RECORD;
  v_mission RECORD;
  v_distance numeric;
  v_notification_count integer := 0;
BEGIN
  IF NEW.from_latitude IS NULL OR NEW.from_longitude IS NULL THEN
    RETURN NEW;
  END IF;

  FOR v_mover IN
    SELECT DISTINCT m.id, m.user_id, m.company_name
    FROM movers m
    WHERE m.verification_status = 'verified'
    AND m.is_active = true
    AND m.email_notifications_enabled = true
  LOOP
    FOR v_mission IN
      SELECT DISTINCT qr.id, qr.to_latitude, qr.to_longitude, qr.to_city, qr.moving_date
      FROM quote_requests qr
      INNER JOIN quotes q ON q.quote_request_id = qr.id
      WHERE q.mover_id = v_mover.id
      AND q.status = 'accepted'
      AND qr.status IN ('accepted', 'ongoing')
      AND qr.to_latitude IS NOT NULL
      AND qr.to_longitude IS NOT NULL
      AND qr.moving_date >= CURRENT_DATE
    LOOP
      v_distance := calculate_distance_km(
        v_mission.to_latitude,
        v_mission.to_longitude,
        NEW.from_latitude,
        NEW.from_longitude
      );

      IF v_distance IS NOT NULL AND v_distance <= 200 THEN
        INSERT INTO notifications (
          user_id,
          user_type,
          title,
          message,
          type,
          related_id,
          read,
          data
        ) VALUES (
          v_mover.user_id,
          'mover',
          'Nouvelle demande proche de votre mission',
          format(
            'Une nouvelle demande de déménagement depuis %s est disponible à seulement %s km du point d''arrivée de votre mission à %s (prévue le %s). Cela pourrait être une opportunité de rentabiliser votre retour !',
            NEW.from_city,
            ROUND(v_distance, 1),
            v_mission.to_city,
            to_char(v_mission.moving_date, 'DD/MM/YYYY')
          ),
          'nearby_mission_opportunity',
          NEW.id,
          false,
          jsonb_build_object(
            'quote_request_id', NEW.id,
            'existing_mission_id', v_mission.id,
            'distance_km', ROUND(v_distance, 1),
            'from_city', NEW.from_city,
            'to_city', NEW.to_city,
            'existing_mission_to_city', v_mission.to_city,
            'existing_mission_date', v_mission.moving_date,
            'moving_date', NEW.moving_date
          )
        )
        ON CONFLICT DO NOTHING;

        v_notification_count := v_notification_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  IF v_notification_count > 0 THEN
    RAISE NOTICE 'Créé % notification(s) pour missions proches', v_notification_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter le nouveau type de notification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
    AND e.enumlabel = 'nearby_mission_opportunity'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'nearby_mission_opportunity';
  END IF;
END $$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_nearby_missions ON quote_requests;

CREATE TRIGGER trigger_notify_nearby_missions
  AFTER INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_movers_with_nearby_missions();

-- Créer une vue pour l'analyse
CREATE OR REPLACE VIEW nearby_mission_opportunities AS
SELECT
  qr_new.id as new_request_id,
  qr_new.from_city as new_from_city,
  qr_new.to_city as new_to_city,
  qr_new.moving_date as new_moving_date,
  m.id as mover_id,
  m.company_name,
  qr_existing.id as existing_mission_id,
  qr_existing.to_city as existing_to_city,
  qr_existing.moving_date as existing_mission_date,
  calculate_distance_km(
    qr_existing.to_latitude,
    qr_existing.to_longitude,
    qr_new.from_latitude,
    qr_new.from_longitude
  ) as distance_km
FROM quote_requests qr_new
CROSS JOIN movers m
INNER JOIN quotes q ON q.mover_id = m.id
INNER JOIN quote_requests qr_existing ON qr_existing.id = q.quote_request_id
WHERE m.verification_status = 'verified'
AND m.is_active = true
AND q.status = 'accepted'
AND qr_existing.status IN ('accepted', 'ongoing')
AND qr_existing.moving_date >= CURRENT_DATE
AND qr_new.from_latitude IS NOT NULL
AND qr_new.from_longitude IS NOT NULL
AND qr_existing.to_latitude IS NOT NULL
AND qr_existing.to_longitude IS NOT NULL
AND calculate_distance_km(
  qr_existing.to_latitude,
  qr_existing.to_longitude,
  qr_new.from_latitude,
  qr_new.from_longitude
) <= 200
ORDER BY distance_km ASC;
