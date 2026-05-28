-- Créer un utilisateur de test pour les Mini-Boutiques (version corrigée)
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at,
    raw_user_meta_data
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'test@vendeur.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "vendor", "full_name": "Test Vendeur"}'::jsonb
);

-- Créer une boutique de test
INSERT INTO public.shops (
    id,
    name,
    slug,
    description,
    user_id,
    status,
    category,
    city,
    phone,
    email,
    created_at,
    updated_at
) VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Boutique Test Premium',
    'boutique-test-premium',
    'Une boutique de test pour démontrer toutes les fonctionnalités',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'approved',
    'Mode & Accessoires',
    'Ouagadougou',
    '+226 70 00 00 00',
    'test@vendeur.com',
    NOW(),
    NOW()
);

-- Créer les paramètres d'authentification vendeur
INSERT INTO public.shop_auth (
    id,
    shop_id,
    shop_url,
    vendor_login,
    vendor_password,
    is_active,
    created_at,
    updated_at
) VALUES (
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'https://mangootech.com/shop/boutique-test-premium',
    'vendor_test',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    true,
    NOW(),
    NOW()
);

-- Créer quelques produits de test avec la structure correcte
INSERT INTO public.products (
    id,
    shop_id,
    name,
    slug,
    description,
    price,
    status,
    created_at,
    updated_at
) VALUES 
    (
        'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'Smartphone Premium X1',
        'smartphone-premium-x1',
        'Un smartphone haut de gamme avec toutes les fonctionnalités',
        299990,
        'active',
        NOW(),
        NOW()
    ),
    (
        'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'Laptop Pro 15"',
        'laptop-pro-15',
        'Ordinateur portable professionnel pour le travail et les jeux',
        899990,
        'active',
        NOW(),
        NOW()
    ),
    (
        'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'Casque Audio Sans Fil',
        'casque-audio-sans-fil',
        'Casque Bluetooth avec réduction de bruit active',
        129990,
        'active',
        NOW(),
        NOW()
    );