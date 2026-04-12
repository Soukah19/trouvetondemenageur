/*
  # Anonymiser le nom du déménageur dans les notifications de nouveau devis
  
  1. Changements
    - Modifier la fonction notify_client_new_quote() pour afficher "Déménageur X" au lieu du nom de l'entreprise
    - Le numéro X correspond à l'ordre d'arrivée du devis (1er, 2ème, 3ème, etc.)
    
  2. Sécurité
    - Maintien des RLS policies existantes
    - Pas de changement aux permissions
    
  3. Notes
    - Protège l'anonymat des déménageurs dans les notifications
    - Cohérent avec l'affichage dans l'interface (Déménageur 1, 2, 3...)
*/

-- Fonction mise à jour : Notifier le client quand un nouveau devis est soumis (avec anonymat)
CREATE OR REPLACE FUNCTION notify_client_new_quote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_user_exists boolean;
  v_quote_number integer;
BEGIN
  -- Récupérer le client_id depuis quote_request
  SELECT client_user_id INTO v_client_id
  FROM quote_requests
  WHERE id = NEW.quote_request_id;
  
  -- Calculer le numéro du déménageur (ordre d'arrivée des devis)
  SELECT COUNT(*) INTO v_quote_number
  FROM quotes
  WHERE quote_request_id = NEW.quote_request_id
  AND created_at <= NEW.created_at;
  
  -- Vérifier si le client existe et créer la notification
  IF v_client_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_client_id) INTO v_user_exists;
    
    IF v_user_exists THEN
      PERFORM create_notification(
        v_client_id,
        'client',
        'Nouveau devis reçu',
        format('Déménageur %s a soumis un devis de %s€', v_quote_number, NEW.client_display_price),
        'new_quote',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
