/*
  # Recréation complète des comptes administrateurs
  
  1. Objectif
    - Recréer le compte super admin avec email admin@trouveton.fr
    - Recréer le compte admin agent avec email adminagent@trouveton.fr
    - Mot de passe: 123456 pour les deux comptes
    
  2. Comptes créés
    - Super Admin: admin@trouveton.fr / 123456
    - Admin Agent: adminagent@trouveton.fr / 123456
    
  3. Notes de sécurité
    - Les comptes sont créés avec email_confirmed_at pour éviter la vérification email
    - Les mots de passe doivent être changés en production
*/

-- Nettoyer les anciens comptes admin s'ils existent
DELETE FROM admins WHERE email IN ('admin@trouveton.fr', 'adminagent@trouveton.fr', 'superadmin@trouveton.fr');
DELETE FROM auth.users WHERE email IN ('admin@trouveton.fr', 'adminagent@trouveton.fr', 'superadmin@trouveton.fr');

-- Créer les comptes admin
DO $$
DECLARE
  superadmin_id uuid;
  adminagent_id uuid;
BEGIN
  -- Créer le compte super admin avec admin@trouveton.fr
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
    'admin@trouveton.fr',
    extensions.crypt('123456', extensions.gen_salt('bf')),
    NOW(),
    '{}'::jsonb,
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
    extensions.crypt('123456', extensions.gen_salt('bf')),
    NOW(),
    '{}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  )
  RETURNING id INTO adminagent_id;

  -- Insérer dans la table admins
  INSERT INTO admins (user_id, email, role, created_at)
  VALUES 
    (superadmin_id, 'admin@trouveton.fr', 'super_admin', NOW()),
    (adminagent_id, 'adminagent@trouveton.fr', 'admin_agent', NOW());

END $$;
