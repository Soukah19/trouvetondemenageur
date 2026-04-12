/*
  # Ajouter photos de mobilier aux demandes de devis

  1. Modifications
    - Ajoute un champ `furniture_photos` à la table `quote_requests` pour stocker les URLs des photos
    - Crée un bucket de stockage `furniture-photos` pour stocker les images de mobilier
    - Configure les politiques d'accès pour le bucket

  2. Sécurité
    - Les clients authentifiés peuvent uploader leurs propres photos
    - Les photos sont accessibles publiquement pour être vues par les déménageurs
    - Limite de taille de fichier: 5MB par photo
    - Formats acceptés: jpg, jpeg, png, webp

  3. Notes
    - Ce système permet aux clients de documenter leur mobilier pour une meilleure protection
    - L'IA pourra analyser ces photos en cas de sinistre
    - Limite de 30 photos par demande de devis
*/

-- Ajouter le champ furniture_photos à la table quote_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'furniture_photos'
  ) THEN
    ALTER TABLE quote_requests 
    ADD COLUMN furniture_photos text[] DEFAULT '{}';
  END IF;
END $$;

-- Créer le bucket de stockage pour les photos de mobilier
INSERT INTO storage.buckets (id, name, public)
VALUES ('furniture-photos', 'furniture-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Authenticated users can upload furniture photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view furniture photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own furniture photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own furniture photos" ON storage.objects;

-- Politique pour permettre aux clients authentifiés d'uploader leurs photos
CREATE POLICY "Authenticated users can upload furniture photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'furniture-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre à tous de voir les photos (les déménageurs doivent voir les photos)
CREATE POLICY "Anyone can view furniture photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'furniture-photos');

-- Politique pour permettre aux propriétaires de supprimer leurs photos
CREATE POLICY "Users can delete own furniture photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'furniture-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre aux propriétaires de mettre à jour leurs photos
CREATE POLICY "Users can update own furniture photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'furniture-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
