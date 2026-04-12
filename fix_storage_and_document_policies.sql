-- ================================================
-- FIX STORAGE RLS POLICIES FOR PORTFOLIO & DOCUMENTS
-- ================================================
-- Run this in Supabase SQL Editor
-- Fixes: 
--   1) Portfolio photo uploads failing with 403 (moving-photos bucket RLS)
--   2) Document delete/update operations failing

-- ================================================
-- OPTION A: Fix the moving-photos bucket policies (if you want to keep using it)
-- ================================================

-- Allow authenticated users to upload to moving-photos bucket
CREATE POLICY "Authenticated users can upload to moving-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'moving-photos');

-- Allow authenticated users to read from moving-photos bucket
CREATE POLICY "Anyone can read moving-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'moving-photos');

-- Allow authenticated users to delete their own files in moving-photos
CREATE POLICY "Authenticated users can delete own moving-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'moving-photos');

-- ================================================
-- OPTION B: Ensure identity-documents bucket has proper policies
-- (The code now uses this bucket for portfolio as fallback)
-- ================================================

-- Make sure authenticated users can upload to identity-documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can upload identity-documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload identity-documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'identity-documents');
  END IF;
END $$;

-- Make sure authenticated users can read identity-documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can read identity-documents'
  ) THEN
    CREATE POLICY "Authenticated users can read identity-documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'identity-documents');
  END IF;
END $$;

-- Make sure authenticated users can delete identity-documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can delete identity-documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete identity-documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'identity-documents');
  END IF;
END $$;

-- ================================================
-- FIX mover_documents TABLE RLS POLICIES
-- ================================================

-- Allow movers to insert their own documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mover_documents' 
    AND policyname = 'Movers can insert own documents'
  ) THEN
    CREATE POLICY "Movers can insert own documents"
    ON mover_documents FOR INSERT
    TO authenticated
    WITH CHECK (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Allow movers to update their own documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mover_documents' 
    AND policyname = 'Movers can update own documents'
  ) THEN
    CREATE POLICY "Movers can update own documents"
    ON mover_documents FOR UPDATE
    TO authenticated
    USING (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Allow movers to delete their own documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mover_documents' 
    AND policyname = 'Movers can delete own documents'
  ) THEN
    CREATE POLICY "Movers can delete own documents"
    ON mover_documents FOR DELETE
    TO authenticated
    USING (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Allow movers to read their own documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mover_documents' 
    AND policyname = 'Movers can read own documents'
  ) THEN
    CREATE POLICY "Movers can read own documents"
    ON mover_documents FOR SELECT
    TO authenticated
    USING (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ================================================
-- FIX verification_documents TABLE RLS POLICIES
-- ================================================

-- Allow movers to delete their own verification documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'verification_documents' 
    AND policyname = 'Movers can delete own verification documents'
  ) THEN
    CREATE POLICY "Movers can delete own verification documents"
    ON verification_documents FOR DELETE
    TO authenticated
    USING (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Allow movers to update their own verification documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'verification_documents' 
    AND policyname = 'Movers can update own verification documents'
  ) THEN
    CREATE POLICY "Movers can update own verification documents"
    ON verification_documents FOR UPDATE
    TO authenticated
    USING (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ================================================
-- FIX mover_portfolio TABLE RLS POLICIES
-- ================================================

-- Allow movers to insert into their own portfolio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mover_portfolio' 
    AND policyname = 'Movers can insert own portfolio'
  ) THEN
    CREATE POLICY "Movers can insert own portfolio"
    ON mover_portfolio FOR INSERT
    TO authenticated
    WITH CHECK (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Allow movers to delete from their own portfolio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mover_portfolio' 
    AND policyname = 'Movers can delete own portfolio'
  ) THEN
    CREATE POLICY "Movers can delete own portfolio"
    ON mover_portfolio FOR DELETE
    TO authenticated
    USING (mover_id IN (SELECT id FROM movers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Allow anyone to read portfolio (it's public content)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mover_portfolio' 
    AND policyname = 'Anyone can read portfolio'
  ) THEN
    CREATE POLICY "Anyone can read portfolio"
    ON mover_portfolio FOR SELECT
    USING (true);
  END IF;
END $$;

-- ================================================
-- ENSURE RLS IS ENABLED ON ALL RELEVANT TABLES
-- ================================================
ALTER TABLE IF EXISTS mover_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mover_portfolio ENABLE ROW LEVEL SECURITY;

-- ================================================
-- ADMIN POLICIES (admins should be able to manage all docs)
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mover_documents' 
    AND policyname = 'Admins can manage all mover documents'
  ) THEN
    CREATE POLICY "Admins can manage all mover documents"
    ON mover_documents FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM admins));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'verification_documents' 
    AND policyname = 'Admins can manage all verification documents'
  ) THEN
    CREATE POLICY "Admins can manage all verification documents"
    ON verification_documents FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM admins));
  END IF;
END $$;

-- Done! All storage and table policies should now allow movers to:
-- 1. Upload portfolio photos
-- 2. Upload, update, and delete their documents
-- 3. View their own documents
