/*
  # Ajouter la colonne data à notifications

  1. Modifications
    - Ajouter colonne data (JSONB) pour métadonnées des notifications
    - Créer index GIN pour requêtes performantes sur data
    - Migrer related_id vers data pour cohérence

  2. Impact
    - Permettre le stockage de métadonnées riches
    - Rendre compatible avec les fonctions existantes
    - Améliorer la flexibilité du système de notifications
*/

-- Ajouter la colonne data si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'data'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
        
        -- Créer un index GIN pour les requêtes sur data
        CREATE INDEX idx_notifications_data ON notifications USING GIN (data);
        
        COMMENT ON COLUMN notifications.data IS 'Données supplémentaires en format JSONB pour contexte de notification';
    END IF;
END $$;

-- Migrer related_id vers data pour cohérence (si related_id existe et est renseigné)
UPDATE notifications 
SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb), 
    '{related_id}', 
    to_jsonb(related_id)
)
WHERE related_id IS NOT NULL 
  AND (data IS NULL OR data->>'related_id' IS NULL);
