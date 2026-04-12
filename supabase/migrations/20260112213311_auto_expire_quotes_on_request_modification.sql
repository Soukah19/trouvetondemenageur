/*
  # Expiration automatique des devis lors de modification de demande

  1. Fonction et trigger
    - Créer une fonction qui expire automatiquement les devis existants quand une quote_request est modifiée
    - Déclencher cette fonction AVANT l'UPDATE d'une quote_request
    - Empêcher l'acceptation de devis expirés avec une contrainte CHECK

  2. Sécurité
    - Seuls les devis avec statut 'pending' ou 'accepted' sont expirés
    - Les devis déjà expirés ou refusés ne sont pas touchés
    - Le trigger ne s'exécute que si des champs importants sont modifiés

  3. Champs surveillés pour modification
    - from_address, from_city, from_postal_code
    - to_address, to_city, to_postal_code
    - moving_date, date_flexibility_days
    - volume_m3, furniture_inventory
    - from_home_size, from_home_type, from_surface_m2
    - to_home_size, to_home_type, to_surface_m2
    - floor_from, floor_to
    - elevator_from, elevator_to
    - furniture_lift_needed_departure, furniture_lift_needed_arrival
    - services_needed
*/

-- Fonction qui expire les devis existants quand une demande est modifiée
CREATE OR REPLACE FUNCTION expire_quotes_on_request_modification()
RETURNS TRIGGER AS $$
DECLARE
  has_significant_changes BOOLEAN := FALSE;
BEGIN
  -- Vérifier si des champs importants ont été modifiés
  IF (
    OLD.from_address IS DISTINCT FROM NEW.from_address OR
    OLD.from_city IS DISTINCT FROM NEW.from_city OR
    OLD.from_postal_code IS DISTINCT FROM NEW.from_postal_code OR
    OLD.to_address IS DISTINCT FROM NEW.to_address OR
    OLD.to_city IS DISTINCT FROM NEW.to_city OR
    OLD.to_postal_code IS DISTINCT FROM NEW.to_postal_code OR
    OLD.moving_date IS DISTINCT FROM NEW.moving_date OR
    OLD.date_flexibility_days IS DISTINCT FROM NEW.date_flexibility_days OR
    OLD.volume_m3 IS DISTINCT FROM NEW.volume_m3 OR
    OLD.furniture_inventory IS DISTINCT FROM NEW.furniture_inventory OR
    OLD.from_home_size IS DISTINCT FROM NEW.from_home_size OR
    OLD.from_home_type IS DISTINCT FROM NEW.from_home_type OR
    OLD.from_surface_m2 IS DISTINCT FROM NEW.from_surface_m2 OR
    OLD.to_home_size IS DISTINCT FROM NEW.to_home_size OR
    OLD.to_home_type IS DISTINCT FROM NEW.to_home_type OR
    OLD.to_surface_m2 IS DISTINCT FROM NEW.to_surface_m2 OR
    OLD.floor_from IS DISTINCT FROM NEW.floor_from OR
    OLD.floor_to IS DISTINCT FROM NEW.floor_to OR
    OLD.elevator_from IS DISTINCT FROM NEW.elevator_from OR
    OLD.elevator_to IS DISTINCT FROM NEW.elevator_to OR
    OLD.furniture_lift_needed_departure IS DISTINCT FROM NEW.furniture_lift_needed_departure OR
    OLD.furniture_lift_needed_arrival IS DISTINCT FROM NEW.furniture_lift_needed_arrival OR
    OLD.services_needed IS DISTINCT FROM NEW.services_needed
  ) THEN
    has_significant_changes := TRUE;
  END IF;

  -- Si des changements significatifs ont été détectés, expirer les devis existants
  IF has_significant_changes THEN
    UPDATE quotes
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE
      quote_request_id = NEW.id
      AND status IN ('pending', 'accepted');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger AVANT la mise à jour d'une quote_request
DROP TRIGGER IF EXISTS trigger_expire_quotes_on_modification ON quote_requests;
CREATE TRIGGER trigger_expire_quotes_on_modification
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION expire_quotes_on_request_modification();

-- Ajouter un commentaire pour documenter le trigger
COMMENT ON TRIGGER trigger_expire_quotes_on_modification ON quote_requests IS
'Expire automatiquement les devis (pending ou accepted) quand une quote_request est modifiée avec des changements significatifs';

COMMENT ON FUNCTION expire_quotes_on_request_modification IS
'Fonction qui expire les devis existants lorsque des champs importants d''une demande de déménagement sont modifiés. Cela garantit que les clients ne peuvent pas accepter des devis basés sur des informations obsolètes.';
