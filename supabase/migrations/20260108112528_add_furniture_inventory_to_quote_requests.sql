/*
  # Ajout inventaire mobilier aux demandes de devis

  1. Modifications
    - Ajout champ `furniture_inventory` (JSONB) à la table `quote_requests`
      - Stocke la sélection détaillée des meubles par pièce
      - Permet de restaurer l'état du calculateur de volume lors d'une modification
      - Format: {
          "selectedItems": {"Canapé 2 places": 1, "Table basse": 2, ...},
          "customFurniture": [{"name": "Armoire custom", "volume": 2.5, "count": 1}, ...]
        }

  2. Sécurité
    - Aucune modification RLS nécessaire (utilise les politiques existantes)
    - Le champ est facultatif (nullable) pour compatibilité avec les demandes existantes
*/

-- Ajouter le champ furniture_inventory à la table quote_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'furniture_inventory'
  ) THEN
    ALTER TABLE quote_requests
    ADD COLUMN furniture_inventory jsonb DEFAULT NULL;
  END IF;
END $$;

-- Créer un index pour améliorer les performances de recherche sur le JSON
CREATE INDEX IF NOT EXISTS idx_quote_requests_furniture_inventory
ON quote_requests USING GIN (furniture_inventory);

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN quote_requests.furniture_inventory IS
'Inventaire détaillé des meubles sélectionnés dans le calculateur de volume. Format JSON: {selectedItems: {itemName: count}, customFurniture: [{name, volume, count}]}';
