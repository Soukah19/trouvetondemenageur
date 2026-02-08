/*
  # Ajouter les types de documents d'identité

  1. Modifications
    - Mise à jour de la contrainte CHECK sur mover_documents.document_type
    - Ajout des types 'identity_recto' et 'identity_verso' pour les documents d'identité
  
  2. Objectif
    - Permettre le stockage des documents d'identité (recto/verso) dans mover_documents
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE mover_documents DROP CONSTRAINT IF EXISTS mover_documents_document_type_check;

-- Ajouter la nouvelle contrainte avec les types d'identité
ALTER TABLE mover_documents ADD CONSTRAINT mover_documents_document_type_check 
  CHECK (document_type = ANY (ARRAY['kbis'::text, 'insurance'::text, 'license'::text, 'identity_recto'::text, 'identity_verso'::text, 'other'::text]));
