-- Migration pour créer les politiques RLS pour la table shop_auth
-- Cela permettra l'accès approprié aux données d'authentification des vendeurs

-- Politique pour permettre la lecture aux utilisateurs authentifiés
CREATE POLICY "Allow read access to authenticated users" ON shop_auth
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Allow insert for authenticated users" ON shop_auth
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Allow update for authenticated users" ON shop_auth
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Allow delete for authenticated users" ON shop_auth
    FOR DELETE
    TO authenticated
    USING (true);

-- Politique spécifique pour permettre l'accès complet à l'administrateur
CREATE POLICY "Allow full access to admin users" ON shop_auth
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = shop_auth.shop_id 
            AND shops.user_id = auth.uid()
        )
    );

-- Accorder les permissions nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON shop_auth TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shop_auth TO anon;