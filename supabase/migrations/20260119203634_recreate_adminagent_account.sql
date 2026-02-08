/*
  # Recréer le compte Admin Agent proprement

  1. Actions
    - Supprimer complètement les anciennes données adminagent
    - Créer un nouveau compte auth user
    - Créer l'entrée dans la table admins
    - Configuration du mot de passe à 123456

  2. Sécurité
    - Le compte est créé avec email confirmé
    - Rôle admin_agent appliqué correctement
*/

-- Supprimer l'ancienne entrée admin si elle existe
DELETE FROM admins WHERE email = 'adminagent@trouveton.fr';

-- Créer une fonction temporaire pour créer le compte
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Supprimer l'ancien utilisateur auth s'il existe
  DELETE FROM auth.users WHERE email = 'adminagent@trouveton.fr';
  
  -- Créer le nouvel utilisateur avec un ID fixe pour cohérence
  new_user_id := gen_random_uuid();
  
  -- Insérer dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
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
    new_user_id,
    'authenticated',
    'authenticated',
    'adminagent@trouveton.fr',
    extensions.crypt('123456', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Créer l'entrée dans la table admins
  INSERT INTO admins (
    user_id,
    email,
    username,
    role,
    created_at
  ) VALUES (
    new_user_id,
    'adminagent@trouveton.fr',
    'adminagent',
    'admin_agent',
    now()
  );
  
  RAISE NOTICE 'Compte adminagent créé avec succès - user_id: %', new_user_id;
END $$;
