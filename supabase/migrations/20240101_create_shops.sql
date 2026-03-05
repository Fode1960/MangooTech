-- Table: shops
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    business_type VARCHAR(50),
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_slug ON shops(slug);
CREATE INDEX IF NOT EXISTS idx_shops_created_at ON shops(created_at DESC);

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "shops_visible_to_public" ON shops
    FOR SELECT
    USING (status = 'approved');

CREATE POLICY "users_manage_own_shops" ON shops
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "admin_manage_all_shops" ON shops
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT ON shops TO anon;
GRANT ALL ON shops TO authenticated;