-- VERIFICATION DES PERMISSIONS DU BUCKET IDENTITY-DOCUMENTS
-- Executez ce script pour vérifier que les documents sont accessibles

-- 1. Vérifier que le bucket existe et est public
SELECT
  id,
  name,
  public as "Est Public",
  created_at as "Créé le"
FROM storage.buckets
WHERE name = 'identity-documents';

-- Résultat attendu : public = true

-- 2. Lister les policies du bucket
SELECT
  policyname as "Nom de la Policy",
  roles as "Rôles",
  cmd as "Commande (SELECT/INSERT/etc)",
  qual as "Condition"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';

-- 3. Compter les documents uploadés
SELECT
  COUNT(*) as "Nombre de fichiers",
  bucket_id as "Bucket"
FROM storage.objects
WHERE bucket_id = 'identity-documents'
GROUP BY bucket_id;

-- 4. Lister les 10 derniers documents uploadés
SELECT
  name as "Nom du fichier",
  created_at as "Uploadé le",
  metadata->>'size' as "Taille (bytes)"
FROM storage.objects
WHERE bucket_id = 'identity-documents'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Vérifier les documents de DROP IT
SELECT
  vd.id,
  vd.document_type as "Type",
  vd.document_url as "URL (partielle)",
  vd.verification_status as "Statut",
  vd.uploaded_at as "Upload le"
FROM verification_documents vd
JOIN movers m ON m.id = vd.mover_id
WHERE m.company_name = 'DROP IT'
ORDER BY vd.uploaded_at DESC;

-- SI LE BUCKET N'EST PAS PUBLIC, EXECUTEZ :
-- UPDATE storage.buckets SET public = true WHERE name = 'identity-documents';

-- SI LES POLICIES N'EXISTENT PAS, EXECUTEZ :
-- CREATE POLICY "Public can view identity documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'identity-documents');
