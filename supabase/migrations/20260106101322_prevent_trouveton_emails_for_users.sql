/*
  # Empêcher l'utilisation d'emails @trouveton.fr pour clients et déménageurs

  1. Nouvelles Contraintes
    - Ajoute un trigger sur la table `movers` pour empêcher l'insertion d'emails @trouveton.fr
    - Les emails @trouveton.fr sont réservés aux administrateurs uniquement
  
  2. Sécurité
    - Protection au niveau base de données
    - Message d'erreur clair pour les utilisateurs
*/

-- Fonction pour vérifier que l'email n'est pas @trouveton.fr
CREATE OR REPLACE FUNCTION check_non_trouveton_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email LIKE '%@trouveton.fr' THEN
    RAISE EXCEPTION 'Les adresses email @trouveton.fr sont réservées aux administrateurs';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur la table movers
DROP TRIGGER IF EXISTS prevent_trouveton_email_movers ON movers;
CREATE TRIGGER prevent_trouveton_email_movers
  BEFORE INSERT OR UPDATE OF email ON movers
  FOR EACH ROW
  EXECUTE FUNCTION check_non_trouveton_email();
