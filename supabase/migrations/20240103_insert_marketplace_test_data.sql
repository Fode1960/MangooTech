-- Insertion de données de test pour le marketplace
-- Catégories
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Électronique', 'electronique', 'Tous les produits électroniques', 1),
    ('Mode', 'mode', 'Vêtements et accessoires', 2),
    ('Maison', 'maison', 'Articles pour la maison', 3),
    ('Sport', 'sport', 'Équipements sportifs', 4),
    ('Beauté', 'beaute', 'Produits de beauté et soins', 5)
ON CONFLICT (slug) DO NOTHING;

-- Boutique de test
INSERT INTO shops (name, slug, description, business_type, status, address, policies, review_count, followers_count) VALUES
    ('Boutique Demo', 'boutique-demo', 'Une boutique de démonstration pour tester le marketplace', 'individual', 'approved', '{"city": "Paris", "country": "France"}', '{"shipping": "Livraison gratuite en France", "returns": "Retours sous 30 jours", "warranty": "Garantie 2 ans"}', 12, 25)
ON CONFLICT (slug) DO NOTHING;

-- Produits de test
INSERT INTO products (shop_id, category_id, name, slug, description, short_description, price, compare_at_price, status, featured, tags, review_count) VALUES
    ((SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), (SELECT id FROM categories WHERE slug = 'electronique' LIMIT 1), 'Smartphone Premium', 'smartphone-premium', 'Un smartphone haut de gamme avec écran OLED et 5G', 'Smartphone 5G haut de gamme', 699.99, 799.99, 'active', true, ARRAY['smartphone', '5G', 'premium'], 8),
    ((SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), (SELECT id FROM categories WHERE slug = 'mode' LIMIT 1), 'Montre Connectée', 'montre-connectee', 'Montre intelligente avec suivi de santé et notifications', 'Montre connectée élégante', 199.99, 249.99, 'active', true, ARRAY['montre', 'connecte', 'sante'], 6),
    ((SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), (SELECT id FROM categories WHERE slug = 'maison' LIMIT 1), 'Enceinte Bluetooth', 'enceinte-bluetooth', 'Enceinte portable avec son haute qualité', 'Enceinte Bluetooth portable', 79.99, 99.99, 'active', false, ARRAY['enceinte', 'bluetooth', 'audio'], 4)
ON CONFLICT (shop_id, slug) DO NOTHING;

-- Variants pour les produits
INSERT INTO product_variants (product_id, name, sku, price, inventory_quantity, inventory_tracking) VALUES
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'Noir 128GB', 'PHONE-BLK-128', 699.99, 15, true),
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'Blanc 128GB', 'PHONE-WHT-128', 699.99, 12, true),
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'Noir 256GB', 'PHONE-BLK-256', 799.99, 8, true),
    ((SELECT id FROM products WHERE slug = 'montre-connectee' LIMIT 1), 'Noir', 'WATCH-BLK', 199.99, 20, true),
    ((SELECT id FROM products WHERE slug = 'montre-connectee' LIMIT 1), 'Rose', 'WATCH-ROS', 199.99, 18, true),
    ((SELECT id FROM products WHERE slug = 'enceinte-bluetooth' LIMIT 1), 'Standard', 'SPEAKER-STD', 79.99, 25, true)
ON CONFLICT DO NOTHING;

-- Images pour les produits
INSERT INTO product_images (product_id, url, alt_text, position, is_primary) VALUES
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'https://via.placeholder.com/600x600/4F46E5/FFFFFF?text=Smartphone+Premium', 'Smartphone Premium - Vue avant', 1, true),
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'https://via.placeholder.com/600x600/7C3AED/FFFFFF?text=Smartphone+Premium', 'Smartphone Premium - Vue arrière', 2, false),
    ((SELECT id FROM products WHERE slug = 'montre-connectee' LIMIT 1), 'https://via.placeholder.com/600x600/EC4899/FFFFFF?text=Montre+Connectée', 'Montre Connectée - Vue principale', 1, true),
    ((SELECT id FROM products WHERE slug = 'enceinte-bluetooth' LIMIT 1), 'https://via.placeholder.com/600x600/10B981/FFFFFF?text=Enceinte+Bluetooth', 'Enceinte Bluetooth - Vue principale', 1, true)
ON CONFLICT DO NOTHING;

SELECT '✅ Données de test marketplace créées avec succès !' AS message;