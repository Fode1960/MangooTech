-- Migration complète pour le module Mini-boutiques

-- Table: shops
CREATE TABLE IF NOT EXISTS shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    business_type VARCHAR(100),
    business_number VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address JSONB,
    social_links JSONB,
    policies JSONB,
    settings JSONB,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    stripe_account_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour shops
CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_slug ON shops(slug);

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    image_url TEXT,
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Table: products
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    track_quantity BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    weight DECIMAL(8,2),
    dimensions JSONB,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    featured BOOLEAN DEFAULT false,
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    tags TEXT[],
    attributes JSONB,
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
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Table: product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    inventory_quantity INTEGER DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions JSONB,
    options JSONB,
    image_url TEXT,
    position INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour product_variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_status ON product_variants(status);

-- Table: product_images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour product_images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(position);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);

-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    customer_notes TEXT,
    internal_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Table: order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_variant_name VARCHAR(255),
    sku VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    seller_amount DECIMAL(10,2) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shop_id ON order_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT[],
    is_verified_purchase BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, product_id, user_id)
);

-- Index pour reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Table: commissions
CREATE TABLE IF NOT EXISTS commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'refunded', 'disputed')),
    release_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour commissions
CREATE INDEX IF NOT EXISTS idx_commissions_order_item_id ON commissions(order_item_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_shop_id ON commissions(shop_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- Table: shop_analytics
CREATE TABLE IF NOT EXISTS shop_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    orders_amount DECIMAL(10,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, date)
);

-- Index pour shop_analytics
CREATE INDEX IF NOT EXISTS idx_shop_analytics_shop_id ON shop_analytics(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_analytics_date ON shop_analytics(date);

-- Fonction pour générer le numéro de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq'::regclass)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Séquence pour les numéros de commande
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- Fonction pour mettre à jour la date de mise à jour
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_analytics_updated_at BEFORE UPDATE ON shop_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies pour shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approved shops" ON shops FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Users can view their own shops" ON shops FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shops" ON shops FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shops" ON shops FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies pour products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON products FOR SELECT
    USING (status = 'active');

CREATE POLICY "Shop owners can view their products" ON products FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Shop owners can create products in their shops" ON products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Shop owners can update their products" ON products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Shop owners can delete their products" ON products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

-- RLS Policies pour product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product variants" ON product_variants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_variants.product_id 
            AND products.status = 'active'
        )
    );

CREATE POLICY "Shop owners can manage their product variants" ON product_variants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products 
            JOIN shops ON shops.id = products.shop_id 
            WHERE products.id = product_variants.product_id 
            AND shops.user_id = auth.uid()
        )
    );

-- RLS Policies pour product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images" ON product_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.status = 'active'
        )
    );

CREATE POLICY "Shop owners can manage their product images" ON product_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products 
            JOIN shops ON shops.id = products.shop_id 
            WHERE products.id = product_images.product_id 
            AND shops.user_id = auth.uid()
        )
    );

-- RLS Policies pour categories (lecture seule pour tous)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin can manage categories" ON categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@mangoo-tech.com'
        )
    );

-- RLS Policies pour orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Shop owners can view orders for their products" ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM order_items 
            JOIN products ON products.id = order_items.product_id 
            JOIN shops ON shops.id = products.shop_id 
            WHERE order_items.order_id = orders.id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own orders" ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies pour order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items for their orders" ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Shop owners can view order items for their products" ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            JOIN shops ON shops.id = products.shop_id 
            WHERE products.id = order_items.product_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create order items for their orders" ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- RLS Policies pour reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Users can view their own reviews" ON reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Shop owners can view reviews for their products" ON reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            JOIN shops ON shops.id = products.shop_id 
            WHERE products.id = reviews.product_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create reviews for their purchases" ON reviews FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (
            SELECT 1 FROM orders 
            JOIN order_items ON order_items.order_id = orders.id 
            WHERE orders.user_id = auth.uid() 
            AND order_items.product_id = reviews.product_id 
            AND orders.status IN ('delivered', 'shipped')
        )
    );

CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage reviews" ON reviews FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@mangoo-tech.com'
        )
    );

-- RLS Policies pour commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view their commissions" ON commissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = commissions.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin can manage commissions" ON commissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@mangoo-tech.com'
        )
    );

-- RLS Policies pour shop_analytics
ALTER TABLE shop_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view their analytics" ON shop_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = shop_analytics.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin can view all analytics" ON shop_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@mangoo-tech.com'
        )
    );

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
    ('Autres', 'autres', 'Autres catégories', 10, true, 5.00);

-- Message de confirmation
SELECT '✅ Migration marketplace réussie ! Les tables et données de test ont été créées.' AS message;