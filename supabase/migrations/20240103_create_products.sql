-- Table: products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    track_quantity BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    weight DECIMAL(8,2),
    dimensions JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    featured BOOLEAN DEFAULT false,
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    tags TEXT[],
    attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('french', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_products_shop_slug ON products(shop_id, slug);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "products_visible_to_public" ON products
    FOR SELECT
    USING (
        status = 'active' AND 
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.status = 'approved'
        )
    );

CREATE POLICY "shop_owners_manage_products" ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "admin_manage_all_products" ON products
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT ON products TO anon;
GRANT ALL ON products TO authenticated;