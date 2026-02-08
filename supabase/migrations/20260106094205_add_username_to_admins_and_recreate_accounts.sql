/*
  # Ajout du système de username pour les admins
  
  1. Modifications
    - Ajout du champ username dans la table admins
    - Modification de la fonction create_admin_accounts pour utiliser username
    
  2. Objectif
    - Les admins se connectent avec username au lieu d'email
    - superadmin = username "superadmin"
    - adminagent = username "adminagent"
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Ajouter le champ username à la table admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'username'
  ) THEN
    ALTER TABLE admins ADD COLUMN username text UNIQUE;
  END IF;
END $$;

-- Supprimer les anciens comptes admin
DELETE FROM admins WHERE email IN ('admin@trouveton.fr', 'adminagent@trouveton.fr', 'superadmin@trouveton.fr');
DELETE FROM auth.users WHERE email IN ('admin@trouveton.fr', 'adminagent@trouveton.fr', 'superadmin@trouveton.fr');

-- Recréer les comptes admin avec username
DO $$
DECLARE
  superadmin_id uuid;
  adminagent_id uuid;
BEGIN
  -- Créer le compte super admin
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'superadmin@trouveton.fr',
    extensions.crypt('SuperAdmin2026!', extensions.gen_salt('bf')),
    NOW(),
    '{"username": "superadmin"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  )
  RETURNING id INTO superadmin_id;

  -- Créer le compte admin agent
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'adminagent@trouveton.fr',
    extensions.crypt('AdminAgent2026!', extensions.gen_salt('bf')),
    NOW(),
    '{"username": "adminagent"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  )
  RETURNING id INTO adminagent_id;

  -- Insérer dans la table admins avec username
  INSERT INTO admins (user_id, username, email, role, created_at)
  VALUES 
    (superadmin_id, 'superadmin', 'superadmin@trouveton.fr', 'super_admin', NOW()),
    (adminagent_id, 'adminagent', 'adminagent@trouveton.fr', 'admin_agent', NOW());

END $$;