-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    commission_amount DECIMAL(10,2) DEFAULT 0 CHECK (commission_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'EUR',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    customer_notes TEXT,
    internal_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_variant_name VARCHAR(255),
    sku VARCHAR(100),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0),
    commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
    seller_amount DECIMAL(10,2) NOT NULL CHECK (seller_amount >= 0),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shop_id ON order_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shop_created ON order_items(shop_id, created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "users_view_own_orders" ON orders
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "shop_owners_view_shop_orders" ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM order_items 
            WHERE order_items.order_id = orders.id 
            AND order_items.shop_id IN (
                SELECT id FROM shops WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "admin_manage_all_orders" ON orders
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for order_items
CREATE POLICY "users_view_own_order_items" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "shop_owners_view_shop_order_items" ON order_items
    FOR SELECT
    USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "admin_manage_all_order_items" ON order_items
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT ON orders TO anon;
GRANT SELECT ON orders TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT SELECT ON order_items TO anon;
GRANT SELECT ON order_items TO authenticated;
GRANT ALL ON order_items TO authenticated;