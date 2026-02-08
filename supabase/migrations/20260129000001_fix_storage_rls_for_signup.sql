/*
  # Fix Storage RLS Policy for Mover Signup

  The issue is that when a user signs up, they authenticate but may not have
  an established session immediately for uploads. We need to allow authenticated
  users to upload documents to their own folder.

  ## Changes:
  1. Drop existing restrictive policies
  2. Create new policies that allow upload during signup flow
  3. Add policies for admins to view documents
*/

-- Drop existing policies for identity-documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own identity documents" ON storage.objects;

-- Drop existing policies for truck-documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload truck documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own truck documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own truck documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own truck documents" ON storage.objects;

-- Create new policies for identity-documents bucket
-- Allow any authenticated user to insert documents to their own folder
CREATE POLICY "identity_documents_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'identity-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own documents
CREATE POLICY "identity_documents_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own documents
CREATE POLICY "identity_documents_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "identity_documents_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin can view all identity documents
CREATE POLICY "identity_documents_admin_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  )
);

-- Create new policies for truck-documents bucket
CREATE POLICY "truck_documents_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'truck-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "truck_documents_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'truck-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "truck_documents_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'truck-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "truck_documents_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'truck-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin can view all truck documents
CREATE POLICY "truck_documents_admin_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'truck-documents' AND
  EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  )
);
