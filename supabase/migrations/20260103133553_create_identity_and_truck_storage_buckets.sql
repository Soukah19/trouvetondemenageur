/*
  # Create Storage Buckets for Identity Documents and Truck Registration Cards

  1. Storage Buckets
    - `identity-documents` - For storing identity cards, passports, driver licenses
    - `truck-documents` - For storing truck registration cards (cartes grises)

  2. Security Policies
    - Authenticated movers can upload their own documents
    - Authenticated movers can view their own documents
    - Public cannot access documents
*/

-- Create identity-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create truck-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('truck-documents', 'truck-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for identity-documents bucket
CREATE POLICY "Authenticated users can upload identity documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own identity documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own identity documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own identity documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies for truck-documents bucket
CREATE POLICY "Authenticated users can upload truck documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'truck-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own truck documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'truck-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own truck documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'truck-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own truck documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'truck-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
