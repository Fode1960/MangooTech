-- Créer un utilisateur de test pour les Mini-Boutiques
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    'test@vendeur.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

-- Créer un profil utilisateur
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'test@vendeur.com'),
    'test@vendeur.com',
    'Test Vendeur',
    'vendor',
    NOW(),
    NOW()
);

-- Créer une boutique de test
INSERT INTO public.shops (
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
    'Boutique Test Premium',
    'boutique-test-premium',
    'Une boutique de test pour démontrer toutes les fonctionnalités',
    (SELECT id FROM auth.users WHERE email = 'test@vendeur.com'),
    'approved',
    'Mode & Accessoires',
    'Ouagadougou',
    '+226 70 00 00 00',
    'test@vendeur.com',
    NOW(),
    NOW()
);

-- Créer les paramètres d''authentification vendeur
INSERT INTO public.shop_auth (
    shop_id,
    shop_url,
    vendor_login,
    vendor_password,
    is_active,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM public.shops WHERE slug = 'boutique-test-premium'),
    'https://mangootech.com/shop/boutique-test-premium',
    'vendor_boutique_test',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    true,
    NOW(),
    NOW()
);

-- Créer quelques produits de test
INSERT INTO public.products (
    shop_id,
    name,
    slug,
    description,
    price,
    status,
    stock_quantity,
    created_at,
    updated_at
) VALUES 
    (
        (SELECT id FROM public.shops WHERE slug = 'boutique-test-premium'),
        'Smartphone Premium X1',
        'smartphone-premium-x1',
        'Un smartphone haut de gamme avec toutes les fonctionnalités',
        299990,
        'active',
        15,
        NOW(),
        NOW()
    ),
    (
        (SELECT id FROM public.shops WHERE slug = 'boutique-test-premium'),
        'Laptop Pro 15"',
        'laptop-pro-15',
        'Ordinateur portable professionnel pour le travail et les jeux',
        899990,
        'active',
        8,
        NOW(),
        NOW()
    ),
    (
        (SELECT id FROM public.shops WHERE slug = 'boutique-test-premium'),
        'Casque Audio Sans Fil',
        'casque-audio-sans-fil',
        'Casque Bluetooth avec réduction de bruit active',
        129990,
        'active',
        25,
        NOW(),
        NOW()
    );