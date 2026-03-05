-- Créer un compte de démonstration pour les tests
-- Email: demo@vendeur.com
-- Mot de passe: Demo123456

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  raw_user_meta_data
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'demo@vendeur.com',
  crypt('Demo123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  jsonb_build_object(
    'role', 'vendor',
    'full_name', 'Démo Vendeur',
    'phone', '+221771234567',
    'address', 'Dakar, Sénégal'
  )
);

-- Accorder les permissions nécessaires
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;