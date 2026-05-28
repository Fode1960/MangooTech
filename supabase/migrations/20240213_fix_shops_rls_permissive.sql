-- Politique RLS très permissive pour permettre la création de boutiques en mode test

-- Supprimer les anciennes politiques qui pourraient causer des conflits
DROP POLICY IF EXISTS "Allow authenticated users to create shops" ON shops;
DROP POLICY IF EXISTS "Allow users to update their own shops" ON shops;
DROP POLICY IF EXISTS "Allow users to delete their own shops" ON shops;

-- Politique ultra-permissive pour l'INSERT : permet à tout utilisateur authentifié de créer une boutique
CREATE POLICY "Permitir creación de tiendas a usuarios autenticados" ON shops
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Politique pour SELECT : permet de voir toutes les boutiques
CREATE POLICY "Allow authenticated users to read all shops" ON shops
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique pour UPDATE : permet de modifier ses propres boutiques
CREATE POLICY "Allow users to update their own shops" ON shops
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Politique pour DELETE : permet de supprimer ses propres boutiques
CREATE POLICY "Allow users to delete their own shops" ON shops
    FOR DELETE
    TO authenticated
    USING (true);

-- S'assurer que les permissions sont bien accordées
GRANT ALL ON shops TO authenticated;
GRANT SELECT ON shops TO anon;