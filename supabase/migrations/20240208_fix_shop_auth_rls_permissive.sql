-- Migration pour créer des politiques RLS plus permissives pour shop_auth
-- Cela permettra aux utilisateurs authentifiés de gérer l'authentification de leurs boutiques

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON shop_auth;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON shop_auth;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON shop_auth;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON shop_auth;
DROP POLICY IF EXISTS "Allow full access to admin users" ON shop_auth;

-- Politique très permissive pour l'insertion (nécessaire pour la création initiale)
CREATE POLICY "Allow insert for any authenticated user" ON shop_auth
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Politique pour la lecture - les utilisateurs peuvent voir toutes les authentifications
CREATE POLICY "Allow read for authenticated users" ON shop_auth
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique pour la mise à jour - les utilisateurs peuvent mettre à jour leurs propres authentifications
CREATE POLICY "Allow update for shop owners" ON shop_auth
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = shop_auth.shop_id 
            AND shops.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = shop_auth.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

-- Politique pour la suppression - seulement les propriétaires peuvent supprimer
CREATE POLICY "Allow delete for shop owners" ON shop_auth
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = shop_auth.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

-- S'assurer que les permissions sont correctement accordées
GRANT ALL ON shop_auth TO authenticated;
GRANT SELECT ON shop_auth TO anon;