-- Migration pour corriger le mot de passe de l'utilisateur admin
-- Mettre à jour le mot de passe pour correspondre au frontend (admin123)

-- Supprimer l'utilisateur admin existant s'il existe
DELETE FROM auth.users WHERE email = 'admin@mangootech.com';
DELETE FROM public.users WHERE email = 'admin@mangootech.com';

-- Recréer l'utilisateur avec le bon mot de passe
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id
    '00000000-0000-0000-0000-000000000001', -- id (UUID admin système)
    'authenticated', -- aud
    'authenticated', -- role
    'admin@mangootech.com', -- email
    crypt('admin123', gen_salt('bf')), -- encrypted_password (admin123)
    NOW(), -- email_confirmed_at
    NULL, -- invited_at
    '', -- confirmation_token
    NULL, -- confirmation_sent_at
    '', -- recovery_token
    NULL, -- recovery_sent_at
    '', -- email_change_token_new
    '', -- email_change
    NULL, -- email_change_sent_at
    NOW(), -- last_sign_in_at
    '{"provider": "email", "providers": ["email"]}', -- raw_app_meta_data
    '{"name": "Administrateur", "role": "admin", "avatar": "👨‍💼"}', -- raw_user_meta_data
    true, -- is_super_admin
    NOW(), -- created_at
    NOW(), -- updated_at
    NULL, -- phone
    NULL, -- phone_confirmed_at
    '', -- phone_change
    '', -- phone_change_token
    NULL -- phone_change_sent_at
) ON CONFLICT (id) DO NOTHING;

-- Recréer le profil dans la table public.users
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    account_type,
    role,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@mangootech.com',
    'Administrateur',
    'Système',
    'individual',
    'super_admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Afficher l'utilisateur créé
SELECT id, email, role, created_at 
FROM auth.users 
WHERE email = 'admin@mangootech.com';