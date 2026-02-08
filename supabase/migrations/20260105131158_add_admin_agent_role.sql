/*
  # Ajouter le rôle Admin Agent

  1. Modifications
    - Ajouter le rôle 'admin_agent' aux valeurs possibles du champ role dans la table admins
    - admin_agent : Peut gérer les déménageurs, clients, offres mais ne voit PAS les finances
    - super_admin : Accès complet incluant les finances

  2. Rôles disponibles
    - super_admin : Accès total (finance + toutes opérations)
    - admin_agent : Gestion opérationnelle uniquement (pas de finance)
    - admin : Rôle administrateur standard
    - support : Support client
*/

-- Modifier la contrainte du champ role pour ajouter admin_agent
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;

ALTER TABLE admins ADD CONSTRAINT admins_role_check 
  CHECK (role = ANY (ARRAY['super_admin'::text, 'admin_agent'::text, 'admin'::text, 'support'::text]));

-- Mettre à jour la valeur par défaut
ALTER TABLE admins ALTER COLUMN role SET DEFAULT 'admin_agent'::text;

-- Ajouter un commentaire pour documenter les rôles
COMMENT ON COLUMN admins.role IS 'Rôle administrateur : super_admin (accès total), admin_agent (gestion opérationnelle sans finance), admin (standard), support (support client)';
