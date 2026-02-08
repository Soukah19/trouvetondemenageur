/*
  # Create Storage Bucket for Moving Photos

  1. New Storage Bucket
    - `moving-photos` bucket for storing all moving-related photos
    - Public bucket for easy access to photos
    - File size limit: 10MB per file

  2. Security
    - Authenticated users can upload photos
    - Anyone can view photos (needed for mover/client access)
    - Users can delete their own photos
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moving-photos',
  'moving-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for moving-photos bucket

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload moving photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'moving-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public access to view photos
CREATE POLICY "Anyone can view moving photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'moving-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update own moving photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'moving-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own moving photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'moving-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );