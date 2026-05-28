-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT[],
    is_verified_purchase BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: commissions
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0),
    commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
    base_amount DECIMAL(10,2) NOT NULL CHECK (base_amount >= 0),
    category_id UUID REFERENCES categories(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'refunded', 'disputed')),
    release_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: shop_analytics
CREATE TABLE IF NOT EXISTS shop_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    orders_amount DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_commissions_order_item_id ON commissions(order_item_id);
CREATE INDEX IF NOT EXISTS idx_commissions_shop_id ON commissions(shop_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_shop_analytics_shop_date ON shop_analytics(shop_id, date);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "reviews_visible_to_public" ON reviews
    FOR SELECT
    USING (status = 'approved');

CREATE POLICY "users_manage_own_reviews" ON reviews
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "shop_owners_view_shop_reviews" ON reviews
    FOR SELECT
    USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for commissions
CREATE POLICY "shop_owners_view_shop_commissions" ON commissions
    FOR SELECT
    USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "admin_manage_all_commissions" ON commissions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for shop_analytics
CREATE POLICY "shop_owners_view_shop_analytics" ON shop_analytics
    FOR SELECT
    USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "admin_view_all_analytics" ON shop_analytics
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT ON reviews TO anon;
GRANT SELECT ON reviews TO authenticated;
GRANT ALL ON reviews TO authenticated;
GRANT SELECT ON commissions TO authenticated;
GRANT SELECT ON shop_analytics TO authenticated;

-- Insert default categories
INSERT INTO categories (name, slug, description, commission_rate) VALUES
('Électronique', 'electronique', 'Appareils électroniques et accessoires', 5.00),
('Mode', 'mode', 'Vêtements, chaussures et accessoires', 8.00),
('Artisanat', 'artisanat', 'Produits faits main et artisanaux', 10.00),
('Maison', 'maison', 'Décoration et ameublement', 7.00),
('Beauté', 'beaute', 'Cosmétiques et soins', 6.00),
('Sports', 'sports', 'Équipements et vêtements de sport', 6.00),
('Livres', 'livres', 'Livres, e-books et supports de lecture', 4.00),
('Jouets', 'jouets', 'Jouets et jeux pour enfants', 8.00);