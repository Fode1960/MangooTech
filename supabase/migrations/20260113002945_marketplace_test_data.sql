-- Migration pour insérer les données de test du marketplace

-- Insertion des catégories par défaut
INSERT INTO categories (name, slug, description, sort_order, is_active, commission_rate) VALUES
    ('Électronique', 'electronique', 'Tous les produits électroniques', 1, true, 5.00),
    ('Mode', 'mode', 'Vêtements et accessoires de mode', 2, true, 5.00),
    ('Maison', 'maison', 'Articles pour la maison et décoration', 3, true, 5.00),
    ('Sport', 'sport', 'Équipements et vêtements de sport', 4, true, 5.00),
    ('Beauté', 'beaute', 'Produits de beauté et soins', 5, true, 5.00),
    ('Livres', 'livres', 'Livres et publications', 6, true, 5.00),
    ('Jouets', 'jouets', 'Jouets et jeux', 7, true, 5.00),
    ('Alimentation', 'alimentation', 'Produits alimentaires', 8, true, 5.00),
    ('Artisanat', 'artisanat', 'Produits faits main', 9, true, 5.00),
    ('Autres', 'autres', 'Autres catégories', 10, true, 5.00)
ON CONFLICT (slug) DO NOTHING;

-- Insertion d'une boutique de démonstration
INSERT INTO shops (user_id, name, slug, description, status, business_type, contact_email, address, commission_rate, created_at, updated_at) 
SELECT 
    (SELECT id FROM auth.users WHERE email = 'demo@example.com' LIMIT 1),
    'Boutique Demo', 
    'boutique-demo', 
    'Une boutique de démonstration pour tester le marketplace', 
    'approved', 
    'individual', 
    'demo@example.com', 
    '{"city": "Paris", "country": "France"}', 
    5.00, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM shops WHERE slug = 'boutique-demo');

-- Insertion de produits de démonstration
INSERT INTO products (shop_id, category_id, name, slug, description, short_description, price, status, featured, tags, created_at, updated_at) 
SELECT 
    (SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), 
    (SELECT id FROM categories WHERE slug = 'electronique' LIMIT 1), 
    'Smartphone Premium', 
    'smartphone-premium', 
    'Un smartphone haut de gamme avec toutes les dernières fonctionnalités', 
    'Smartphone haut de gamme', 
    599.99, 
    'active', 
    true, 
    ARRAY['smartphone', 'premium', 'technologie'], 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'smartphone-premium' AND shop_id = (SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1));

INSERT INTO products (shop_id, category_id, name, slug, description, short_description, price, status, featured, tags, created_at, updated_at) 
SELECT 
    (SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), 
    (SELECT id FROM categories WHERE slug = 'mode' LIMIT 1), 
    'T-shirt en Coton Bio', 
    't-shirt-coton-bio', 
    'T-shirt confortable en coton biologique', 
    'T-shirt écologique', 
    29.99, 
    'active', 
    false, 
    ARRAY['tshirt', 'coton', 'bio', 'mode'], 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 't-shirt-coton-bio' AND shop_id = (SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1));

INSERT INTO products (shop_id, category_id, name, slug, description, short_description, price, status, featured, tags, created_at, updated_at) 
SELECT 
    (SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), 
    (SELECT id FROM categories WHERE slug = 'maison' LIMIT 1), 
    'Lampe Design LED', 
    'lampe-design-led', 
    'Lampe moderne avec technologie LED', 
    'Éclairage moderne', 
    89.99, 
    'active', 
    true, 
    ARRAY['lampe', 'led', 'design', 'maison'], 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'lampe-design-led' AND shop_id = (SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1));

INSERT INTO products (shop_id, category_id, name, slug, description, short_description, price, status, featured, tags, created_at, updated_at) 
SELECT 
    (SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), 
    (SELECT id FROM categories WHERE slug = 'sport' LIMIT 1), 
    'Chaussures de Running', 
    'chaussures-running', 
    'Chaussures de course professionnelles', 
    'Chaussures sport', 
    129.99, 
    'active', 
    false, 
    ARRAY['chaussures', 'running', 'sport'], 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'chaussures-running' AND shop_id = (SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1));

-- Insertion des variantes de produits
INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 
    'Noir 128GB', 
    599.99, 
    10, 
    '{"color": "noir", "storage": "128GB"}', 
    1, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1) AND name = 'Noir 128GB');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 
    'Blanc 128GB', 
    599.99, 
    8, 
    '{"color": "blanc", "storage": "128GB"}', 
    2, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1) AND name = 'Blanc 128GB');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 
    'Noir 256GB', 
    699.99, 
    5, 
    '{"color": "noir", "storage": "256GB"}', 
    3, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1) AND name = 'Noir 256GB');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 't-shirt-coton-bio' LIMIT 1), 
    'Taille S', 
    29.99, 
    50, 
    '{"size": "S"}', 
    1, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 't-shirt-coton-bio' LIMIT 1) AND name = 'Taille S');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 't-shirt-coton-bio' LIMIT 1), 
    'Taille M', 
    29.99, 
    45, 
    '{"size": "M"}', 
    2, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 't-shirt-coton-bio' LIMIT 1) AND name = 'Taille M');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 't-shirt-coton-bio' LIMIT 1), 
    'Taille L', 
    29.99, 
    40, 
    '{"size": "L"}', 
    3, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 't-shirt-coton-bio' LIMIT 1) AND name = 'Taille L');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'lampe-design-led' LIMIT 1), 
    'Standard', 
    89.99, 
    15, 
    '{"type": "standard"}', 
    1, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 'lampe-design-led' LIMIT 1) AND name = 'Standard');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'chaussures-running' LIMIT 1), 
    'Taille 42', 
    129.99, 
    20, 
    '{"size": "42"}', 
    1, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 'chaussures-running' LIMIT 1) AND name = 'Taille 42');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'chaussures-running' LIMIT 1), 
    'Taille 43', 
    129.99, 
    18, 
    '{"size": "43"}', 
    2, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 'chaussures-running' LIMIT 1) AND name = 'Taille 43');

INSERT INTO product_variants (product_id, name, price, inventory_quantity, options, position, status, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'chaussures-running' LIMIT 1), 
    'Taille 44', 
    129.99, 
    16, 
    '{"size": "44"}', 
    3, 
    'active', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = 'chaussures-running' LIMIT 1) AND name = 'Taille 44');

-- Insertion des images de produits
INSERT INTO product_images (product_id, url, alt_text, position, is_primary, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500', 
    'Smartphone Premium Noir', 
    1, 
    true, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1) AND position = 1);

INSERT INTO product_images (product_id, url, alt_text, position, is_primary, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500', 
    'Smartphone Premium Blanc', 
    2, 
    false, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1) AND position = 2);

INSERT INTO product_images (product_id, url, alt_text, position, is_primary, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 't-shirt-coton-bio' LIMIT 1), 
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 
    'T-shirt Coton Bio', 
    1, 
    true, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 't-shirt-coton-bio' LIMIT 1) AND position = 1);

INSERT INTO product_images (product_id, url, alt_text, position, is_primary, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'lampe-design-led' LIMIT 1), 
    'https://images.unsplash.com/photo-1565636192335-f2e4b8f9c0a0?w=500', 
    'Lampe Design LED', 
    1, 
    true, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'lampe-design-led' LIMIT 1) AND position = 1);

INSERT INTO product_images (product_id, url, alt_text, position, is_primary, created_at, updated_at) 
SELECT 
    (SELECT id FROM products WHERE slug = 'chaussures-running' LIMIT 1), 
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 
    'Chaussures de Running', 
    1, 
    true, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'chaussures-running' LIMIT 1) AND position = 1);

-- Message de confirmation
SELECT '✅ Données de test marketplace créées avec succès !' AS message;