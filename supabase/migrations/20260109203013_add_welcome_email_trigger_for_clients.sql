/*
  # Ajouter le trigger d'email de bienvenue pour les clients

  1. Trigger
    - Ajoute un trigger sur la table clients
    - Envoie automatiquement un email de bienvenue lors de l'inscription
    - Utilise la fonction send-welcome-email existante

  2. Sécurité
    - Utilise la fonction trigger_send_welcome_email existante
    - Appel asynchrone pour ne pas bloquer l'insertion
*/

-- Créer le trigger pour les clients
DROP TRIGGER IF EXISTS clients_welcome_email_trigger ON clients;

CREATE TRIGGER clients_welcome_email_trigger
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_welcome_email();

-- Ajouter un commentaire
COMMENT ON TRIGGER clients_welcome_email_trigger ON clients IS 
  'Automatically sends welcome email to new clients after account creation';
