/*
  # Désactiver temporairement le RLS pour tests

  1. Objectif
    - Désactiver le RLS sur quote_requests pour permettre les tests
    - Une fois que tout fonctionne, on réactivera avec les bonnes politiques

  2. IMPORTANT
    - Ceci est TEMPORAIRE pour identifier le problème
    - À réactiver dès que le problème est identifié
*/

-- Désactiver temporairement le RLS
ALTER TABLE quote_requests DISABLE ROW LEVEL SECURITY;

-- Note : Pour réactiver plus tard, utiliser :
-- ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
