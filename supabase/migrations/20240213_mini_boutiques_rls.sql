-- Politiques RLS pour les Mini-Boutiques
-- Activer RLS sur shop_auth
ALTER TABLE shop_auth ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table shops
CREATE POLICY "Users can view their own shops" ON shops
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shops" ON shops
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shops" ON shops
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shops" ON shops
    FOR DELETE
    USING (auth.uid() = user_id);

-- Politiques pour la table products
CREATE POLICY "Users can view products from their shops" ON products
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create products in their shops" ON products
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update products in their shops" ON products
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete products in their shops" ON products
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

-- Politiques pour la table shop_auth
CREATE POLICY "Users can view auth for their own shops" ON shop_auth
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = shop_auth.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create auth for their own shops" ON shop_auth
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = shop_auth.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update auth for their own shops" ON shop_auth
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = shop_auth.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

-- Accès public pour les boutiques approuvées (lecture seulement)
CREATE POLICY "Public can view approved shops" ON shops
    FOR SELECT
    USING (status = 'approved' AND is_verified = true);

-- Accès public pour les produits actifs des boutiques approuvées
CREATE POLICY "Public can view active products from approved shops" ON products
    FOR SELECT
    USING (
        status = 'active' AND 
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = products.shop_id 
            AND shops.status = 'approved' 
            AND shops.is_verified = true
        )
    );