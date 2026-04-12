/*
  # Correction système de notifications pour demandes de devis

  1. Problème identifié
    - Les déménageurs sans zones d'activité définies (activity_departments vide) ne recevaient aucune notification
    - Le trigger detect_activity_zone_matches ne notifiait que les déménageurs avec zones configurées
    - Les nouveaux déménageurs ne voyaient donc aucune demande

  2. Solution
    - Créer automatiquement des notifications pour TOUS les déménageurs vérifiés et actifs
    - Les déménageurs peuvent filtrer les demandes selon leurs préférences côté frontend
    - Cela permet aux nouveaux déménageurs de découvrir les demandes disponibles

  3. Modifications
    - Mise à jour de la fonction detect_activity_zone_matches pour inclure les déménageurs sans zones
    - Si activity_departments est vide, le déménageur reçoit toutes les demandes (mode découverte)
*/

-- Recréer la fonction detect_activity_zone_matches avec correction
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
    AND is_active = true
    AND email_notifications_enabled = true
    AND (
      -- Déménageurs couvrant toute la France
      coverage_type = 'all_france'
      -- Déménageurs avec départements configurés correspondant à la demande
      OR (
        coverage_type = 'departments' 
        AND activity_departments IS NOT NULL
        AND array_length(activity_departments, 1) > 0
        AND (v_from_dept = ANY(activity_departments) OR v_to_dept = ANY(activity_departments))
      )
      -- NOUVEAU: Déménageurs sans zones configurées (mode découverte)
      -- Permet aux nouveaux déménageurs de voir toutes les demandes
      OR (
        coverage_type = 'departments'
        AND (activity_departments IS NULL OR array_length(activity_departments, 1) = 0)
      )
    )
  LOOP
    -- Créer directement la notification dans la table notifications
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
      'Nouvelle demande de devis disponible',
      format('Une nouvelle demande de déménagement de %s (%s) vers %s (%s) le %s est disponible.',
        NEW.from_city,
        LEFT(NEW.from_postal_code, 2),
        NEW.to_city,
        LEFT(NEW.to_postal_code, 2),
        to_char(NEW.moving_date, 'DD/MM/YYYY')
      ),
      'new_quote_request',
      NEW.id,
      false,
      jsonb_build_object(
        'quote_request_id', NEW.id,
        'from_city', NEW.from_city,
        'to_city', NEW.to_city,
        'moving_date', NEW.moving_date
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire explicatif
COMMENT ON FUNCTION detect_activity_zone_matches() IS
'Crée automatiquement des notifications pour les déménageurs lors de nouvelles demandes de devis. Les déménageurs sans zones configurées reçoivent toutes les demandes (mode découverte), permettant aux nouveaux déménageurs de voir les opportunités disponibles.';
