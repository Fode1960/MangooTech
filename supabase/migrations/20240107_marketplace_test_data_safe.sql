-- Migration simplifiée pour ajouter les données de test marketplace
-- Cette migration est plus sûre et évite les conflits

-- Ajouter des colonnes manquantes à la table shops si elles n''existent pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shops' AND column_name = 'review_count') THEN
        ALTER TABLE shops ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shops' AND column_name = 'followers_count') THEN
        ALTER TABLE shops ADD COLUMN followers_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shops' AND column_name = 'rating') THEN
        ALTER TABLE shops ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
    END IF;
END $$;

-- Créer la table categories si elle n''existe pas
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table products si elle n''existe pas
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    featured BOOLEAN DEFAULT false,
    tags TEXT[],
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, slug)
);

-- Créer la table product_variants si elle n''existe pas
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    price DECIMAL(10,2),
    inventory_quantity INTEGER DEFAULT 0,
    inventory_tracking BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table product_images si elle n''existe pas
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les catégories de test
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Électronique', 'electronique', 'Tous les produits électroniques', 1),
    ('Mode', 'mode', 'Vêtements et accessoires', 2),
    ('Maison', 'maison', 'Articles pour la maison', 3),
    ('Sport', 'sport', 'Équipements sportifs', 4),
    ('Beauté', 'beaute', 'Produits de beauté et soins', 5)
ON CONFLICT (slug) DO NOTHING;

-- Vérifier si une boutique de test existe, sinon en créer une
DO $$
DECLARE
    demo_shop_id UUID;
    electronics_cat_id UUID;
    fashion_cat_id UUID;
    home_cat_id UUID;
BEGIN
    -- Récupérer ou créer la boutique de démonstration
    SELECT id INTO demo_shop_id FROM shops WHERE slug = 'boutique-demo' LIMIT 1;
    
    IF demo_shop_id IS NULL THEN
        INSERT INTO shops (name, slug, description, business_type, status, address, policies, review_count, followers_count, rating)
        VALUES ('Boutique Demo', 'boutique-demo', 'Une boutique de démonstration pour tester le marketplace', 'individual', 'approved', 
                '{"city": "Paris", "country": "France"}', '{"shipping": "Livraison gratuite en France", "returns": "Retours sous 30 jours", "warranty": "Garantie 2 ans"}', 12, 25, 4.5)
        RETURNING id INTO demo_shop_id;
    END IF;
    
    -- Récupérer les IDs des catégories
    SELECT id INTO electronics_cat_id FROM categories WHERE slug = 'electronique' LIMIT 1;
    SELECT id INTO fashion_cat_id FROM categories WHERE slug = 'mode' LIMIT 1;
    SELECT id INTO home_cat_id FROM categories WHERE slug = 'maison' LIMIT 1;
    
    -- Insérer les produits de test
    INSERT INTO products (shop_id, category_id, name, slug, description, short_description, price, compare_at_price, status, featured, tags, review_count)
    VALUES 
        (demo_shop_id, electronics_cat_id, 'Smartphone Premium', 'smartphone-premium', 'Un smartphone haut de gamme avec écran OLED et 5G', 'Smartphone 5G haut de gamme', 699.99, 799.99, 'active', true, ARRAY['smartphone', '5G', 'premium'], 8),
        (demo_shop_id, fashion_cat_id, 'Montre Connectée', 'montre-connectee', 'Montre intelligente avec suivi de santé et notifications', 'Montre connectée élégante', 199.99, 249.99, 'active', true, ARRAY['montre', 'connecte', 'sante'], 6),
        (demo_shop_id, home_cat_id, 'Enceinte Bluetooth', 'enceinte-bluetooth', 'Enceinte portable avec son haute qualité', 'Enceinte Bluetooth portable', 79.99, 99.99, 'active', false, ARRAY['enceinte', 'bluetooth', 'audio'], 4)
    ON CONFLICT (shop_id, slug) DO NOTHING;
    
    -- Insérer les variants pour le smartphone
    INSERT INTO product_variants (product_id, name, sku, price, inventory_quantity, inventory_tracking)
    SELECT p.id, 'Noir 128GB', 'PHONE-BLK-128', 699.99, 15, true
    FROM products p WHERE p.slug = 'smartphone-premium'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO product_variants (product_id, name, sku, price, inventory_quantity, inventory_tracking)
    SELECT p.id, 'Blanc 128GB', 'PHONE-WHT-128', 699.99, 12, true
    FROM products p WHERE p.slug = 'smartphone-premium'
    ON CONFLICT DO NOTHING;
    
    -- Insérer les images pour les produits
    INSERT INTO product_images (product_id, url, alt_text, position, is_primary)
    SELECT p.id, 'https://via.placeholder.com/600x600/4F46E5/FFFFFF?text=Smartphone+Premium', 'Smartphone Premium - Vue avant', 1, true
    FROM products p WHERE p.slug = 'smartphone-premium'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO product_images (product_id, url, alt_text, position, is_primary)
    SELECT p.id, 'https://via.placeholder.com/600x600/EC4899/FFFFFF?text=Montre+Connectée', 'Montre Connectée - Vue principale', 1, true
    FROM products p WHERE p.slug = 'montre-connectee'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO product_images (product_id, url, alt_text, position, is_primary)
    SELECT p.id, 'https://via.placeholder.com/600x600/10B981/FFFFFF?text=Enceinte+Bluetooth', 'Enceinte Bluetooth - Vue principale', 1, true
    FROM products p WHERE p.slug = 'enceinte-bluetooth'
    ON CONFLICT DO NOTHING;
    
END $$;

SELECT '✅ Données de test marketplace créées avec succès !' AS message;