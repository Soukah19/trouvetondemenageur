/*
  # Recréation urgente de tous les comptes admins (CORRIGÉ)

  1. Comptes créés
    - superadmin@trouveton.fr / SuperAdmin2026!
    - adminagent@trouveton.fr / AdminAgent2026!
    
  2. Sécurité
    - Les mots de passe sont hashés par Supabase
    - Les comptes sont immédiatement actifs (email confirmé)
*/

-- Supprimer les anciens comptes s'ils existent
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Supprimer superadmin
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'superadmin@trouveton.fr';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;
  
  -- Supprimer adminagent
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'adminagent@trouveton.fr';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;
END $$;

-- Créer le compte SuperAdmin
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
    extensions.crypt('SuperAdmin2026!', extensions.gen_salt('bf')),
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
    'superadmin@trouveton.fr',
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
    format('{"sub":"%s","email":"%s"}', v_user_id::text, 'superadmin@trouveton.fr')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'SuperAdmin créé avec succès: superadmin@trouveton.fr / SuperAdmin2026!';
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
    'adminagent@trouveton.fr',
    extensions.crypt('AdminAgent2026!', extensions.gen_salt('bf')),
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
    'adminagent@trouveton.fr',
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
    format('{"sub":"%s","email":"%s"}', v_user_id::text, 'adminagent@trouveton.fr')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'AdminAgent créé avec succès: adminagent@trouveton.fr / AdminAgent2026!';
END $$;
