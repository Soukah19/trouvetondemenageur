/*
  # Correction des comptes admins avec les bons identifiants

  1. Comptes créés
    - admin@trouveton.fr / 123456 (Super Admin)
    - superadmin@trouveton.fr / 123456 (Admin Agent)
    
  2. Sécurité
    - Les mots de passe sont hashés par Supabase
    - Les comptes sont immédiatement actifs (email confirmé)
*/

-- Supprimer tous les comptes admins existants
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Supprimer tous les anciens comptes
  FOR v_user_id IN 
    SELECT id FROM auth.users WHERE email LIKE '%trouveton.fr%'
  LOOP
    DELETE FROM auth.users WHERE id = v_user_id;
  END LOOP;
END $$;

-- Créer le compte Super Admin
DO $$
DECLARE
  v_user_id uuid;
  v_identity_id uuid;
BEGIN
  v_user_id := gen_random_uuid();
  v_identity_id := gen_random_uuid();

  -- Créer l'utilisateur auth
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'admin@trouveton.fr',
    extensions.crypt('123456', extensions.gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"],"role":"super_admin"}',
    '{"full_name":"Super Administrateur"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Créer le profil admin
  INSERT INTO admins (id, user_id, email, role, permissions)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'admin@trouveton.fr',
    'super_admin',
    '{"manage_users": true, "manage_movers": true, "manage_quotes": true, "view_analytics": true, "manage_payments": true}'::jsonb
  );

  -- Créer l'identité
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_identity_id,
    v_user_id::text,
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id::text, 'admin@trouveton.fr')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Super Admin créé: admin@trouveton.fr / 123456';
END $$;

-- Créer le compte AdminAgent
DO $$
DECLARE
  v_user_id uuid;
  v_identity_id uuid;
BEGIN
  v_user_id := gen_random_uuid();
  v_identity_id := gen_random_uuid();

  -- Créer l'utilisateur auth
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'superadmin@trouveton.fr',
    extensions.crypt('123456', extensions.gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"],"role":"admin_agent"}',
    '{"full_name":"Admin Agent"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Créer le profil admin
  INSERT INTO admins (id, user_id, email, role, permissions)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'superadmin@trouveton.fr',
    'admin_agent',
    '{"manage_users": false, "manage_movers": true, "manage_quotes": true, "view_analytics": true, "manage_payments": false}'::jsonb
  );

  -- Créer l'identité
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_identity_id,
    v_user_id::text,
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id::text, 'superadmin@trouveton.fr')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Admin Agent créé: superadmin@trouveton.fr / 123456';
END $$;
