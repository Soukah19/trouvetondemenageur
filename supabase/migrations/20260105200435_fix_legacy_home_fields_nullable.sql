/*
  # Rendre les anciens champs home_size, home_type et surface_m2 optionnels

  1. Modifications
    - Rendre `home_size` nullable (anciennement NOT NULL)
    - Rendre `home_type` nullable (anciennement NOT NULL)
    - `surface_m2` est déjà nullable
  
  2. Raison
    - Les nouveaux champs `from_home_size`/`to_home_size` et `from_home_type`/`to_home_type` sont maintenant utilisés
    - Les anciens champs sont conservés pour compatibilité mais ne sont plus obligatoires
    - Cela évite l'erreur "null value in column home_size violates not-null constraint" lors de nouvelles insertions

  3. Notes importantes
    - Cette migration est sûre car elle rend des champs MOINS restrictifs
    - Les données existantes ne sont pas affectées
    - Les applications utilisant les nouveaux champs fonctionneront correctement
*/

-- Rendre home_size nullable
ALTER TABLE quote_requests ALTER COLUMN home_size DROP NOT NULL;

-- Rendre home_type nullable
ALTER TABLE quote_requests ALTER COLUMN home_type DROP NOT NULL;
