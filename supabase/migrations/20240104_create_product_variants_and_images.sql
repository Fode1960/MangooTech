-- Table: product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
    weight DECIMAL(8,2),
    dimensions JSONB,
    options JSONB,
    image_url TEXT,
    position INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: product_images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_status ON product_variants(status);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variants
CREATE POLICY "product_variants_visible_with_product" ON product_variants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_variants.product_id
            AND products.status = 'active'
            AND EXISTS (
                SELECT 1 FROM shops 
                WHERE shops.id = products.shop_id 
                AND shops.status = 'approved'
            )
        )
    );

CREATE POLICY "shop_owners_manage_variants" ON product_variants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products 
            JOIN shops ON shops.id = products.shop_id
            WHERE products.id = product_variants.product_id 
            AND shops.user_id = auth.uid()
        )
    );

-- RLS Policies for product_images
CREATE POLICY "product_images_visible_with_product" ON product_images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id
            AND products.status = 'active'
            AND EXISTS (
                SELECT 1 FROM shops 
                WHERE shops.id = products.shop_id 
                AND shops.status = 'approved'
            )
        )
    );

CREATE POLICY "shop_owners_manage_images" ON product_images
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products 
            JOIN shops ON shops.id = products.shop_id
            WHERE products.id = product_images.product_id 
            AND shops.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT ON product_variants TO anon;
GRANT ALL ON product_variants TO authenticated;
GRANT SELECT ON product_images TO anon;
GRANT ALL ON product_images TO authenticated;