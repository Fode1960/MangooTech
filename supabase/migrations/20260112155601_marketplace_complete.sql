-- Migration complète pour le module Mini-boutiques/Marketplace
-- Création des tables manquantes et insertion de données de test

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Table: products
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
    cost_price DECIMAL(10,2),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    weight DECIMAL(8,2),
    dimensions JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    featured BOOLEAN DEFAULT false,
    tags TEXT[],
    images JSONB,
    options JSONB,
    seo_title VARCHAR(255),
    seo_description TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, slug)
);

-- Index pour products
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Table: product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    weight DECIMAL(8,2),
    dimensions JSONB,
    options JSONB,
    inventory_quantity INTEGER DEFAULT 0,
    inventory_policy VARCHAR(20) DEFAULT 'deny' CHECK (inventory_policy IN ('deny', 'continue')),
    inventory_tracking BOOLEAN DEFAULT true,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour product_variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Table: product_images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour product_images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(position);

-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
    currency VARCHAR(3) DEFAULT 'EUR',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_address JSONB,
    billing_address JSONB,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Table: order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_variant_name VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_variant_id ON order_items(product_variant_id);

-- Insertion de données de test
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Électronique', 'electronique', 'Tous les produits électroniques', 1),
    ('Mode', 'mode', 'Vêtements et accessoires', 2),
    ('Maison', 'maison', 'Articles pour la maison', 3),
    ('Sport', 'sport', 'Équipements sportifs', 4),
    ('Beauté', 'beaute', 'Produits de beauté et soins', 5);

-- Insertion d''une boutique de test (sans rating qui n''existe pas encore)
INSERT INTO shops (name, slug, description, business_type, status, address, policies, review_count, followers_count) VALUES
    ('Boutique Demo', 'boutique-demo', 'Une boutique de démonstration pour tester le marketplace', 'individual', 'approved', '{"city": "Paris", "country": "France"}', '{"shipping": "Livraison gratuite en France", "returns": "Retours sous 30 jours", "warranty": "Garantie 2 ans sur tous les produits"}', 12, 25);

-- Insertion de produits de test (sans rating)
INSERT INTO products (shop_id, category_id, name, slug, description, short_description, price, compare_at_price, status, featured, tags, review_count) VALUES
    ((SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), (SELECT id FROM categories WHERE slug = 'electronique' LIMIT 1), 'Smartphone Premium', 'smartphone-premium', 'Un smartphone haut de gamme avec écran OLED et 5G', 'Smartphone 5G haut de gamme', 699.99, 799.99, 'active', true, ARRAY['smartphone', '5G', 'premium'], 8),
    ((SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), (SELECT id FROM categories WHERE slug = 'mode' LIMIT 1), 'Montre Connectée', 'montre-connectee', 'Montre intelligente avec suivi de santé et notifications', 'Montre connectée élégante', 199.99, 249.99, 'active', true, ARRAY['montre', 'connecte', 'sante'], 6),
    ((SELECT id FROM shops WHERE slug = 'boutique-demo' LIMIT 1), (SELECT id FROM categories WHERE slug = 'maison' LIMIT 1), 'Enceinte Bluetooth', 'enceinte-bluetooth', 'Enceinte portable avec son haute qualité', 'Enceinte Bluetooth portable', 79.99, 99.99, 'active', false, ARRAY['enceinte', 'bluetooth', 'audio'], 4);

-- Insertion de variants pour les produits
INSERT INTO product_variants (product_id, name, sku, price, inventory_quantity, inventory_tracking) VALUES
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'Noir 128GB', 'PHONE-BLK-128', 699.99, 15, true),
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'Blanc 128GB', 'PHONE-WHT-128', 699.99, 12, true),
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'Noir 256GB', 'PHONE-BLK-256', 799.99, 8, true),
    ((SELECT id FROM products WHERE slug = 'montre-connectee' LIMIT 1), 'Noir', 'WATCH-BLK', 199.99, 20, true),
    ((SELECT id FROM products WHERE slug = 'montre-connectee' LIMIT 1), 'Rose', 'WATCH-ROS', 199.99, 18, true),
    ((SELECT id FROM products WHERE slug = 'enceinte-bluetooth' LIMIT 1), 'Standard', 'SPEAKER-STD', 79.99, 25, true);

-- Insertion d''images pour les produits
INSERT INTO product_images (product_id, url, alt_text, position, is_primary) VALUES
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'https://via.placeholder.com/600x600/4F46E5/FFFFFF?text=Smartphone+Premium', 'Smartphone Premium - Vue avant', 1, true),
    ((SELECT id FROM products WHERE slug = 'smartphone-premium' LIMIT 1), 'https://via.placeholder.com/600x600/7C3AED/FFFFFF?text=Smartphone+Premium', 'Smartphone Premium - Vue arrière', 2, false),
    ((SELECT id FROM products WHERE slug = 'montre-connectee' LIMIT 1), 'https://via.placeholder.com/600x600/EC4899/FFFFFF?text=Montre+Connectée', 'Montre Connectée - Vue principale', 1, true),
    ((SELECT id FROM products WHERE slug = 'enceinte-bluetooth' LIMIT 1), 'https://via.placeholder.com/600x600/10B981/FFFFFF?text=Enceinte+Bluetooth', 'Enceinte Bluetooth - Vue principale', 1, true);

-- Activer RLS pour toutes les nouvelles tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour categories
CREATE POLICY "categories_visible_to_public" ON categories
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "admin_manage_categories" ON categories
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques RLS pour products
CREATE POLICY "products_visible_to_public" ON products
    FOR SELECT
    USING (status = 'active');

CREATE POLICY "users_manage_own_products" ON products
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM shops 
        WHERE shops.id = products.shop_id 
        AND shops.user_id = auth.uid()
    ));

-- Politiques RLS pour product_variants
CREATE POLICY "product_variants_visible_with_product" ON product_variants
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = product_variants.product_id 
        AND products.status = 'active'
    ));

CREATE POLICY "users_manage_own_variants" ON product_variants
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM products 
        JOIN shops ON shops.id = products.shop_id 
        WHERE products.id = product_variants.product_id 
        AND shops.user_id = auth.uid()
    ));

-- Politiques RLS pour product_images
CREATE POLICY "product_images_visible_with_product" ON product_images
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = product_images.product_id 
        AND products.status = 'active'
    ));

-- Politiques RLS pour orders
CREATE POLICY "users_view_own_orders" ON orders
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "shops_view_own_orders" ON orders
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM shops 
        WHERE shops.id = orders.shop_id 
        AND shops.user_id = auth.uid()
    ));

-- Politiques RLS pour order_items
CREATE POLICY "users_view_own_order_items" ON order_items
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    ));

CREATE POLICY "shops_view_own_order_items" ON order_items
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM orders 
        JOIN shops ON shops.id = orders.shop_id 
        WHERE orders.id = order_items.order_id 
        AND shops.user_id = auth.uid()
    ));

-- Donner les permissions
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON product_variants TO anon, authenticated;
GRANT SELECT ON product_images TO anon, authenticated;
GRANT SELECT ON orders TO authenticated;
GRANT SELECT ON order_items TO authenticated;

GRANT ALL ON categories TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON product_images TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;

-- Message de confirmation
SELECT '✅ Migration marketplace réussie ! Les tables et données de test ont été créées.' AS message;