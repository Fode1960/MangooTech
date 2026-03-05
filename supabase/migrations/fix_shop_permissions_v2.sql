-- Migration pour corriger les politiques RLS de la table shops
-- Supprimer les anciennes politiques s'il y en a
DROP POLICY IF EXISTS "Users can view own shops" ON shops;
DROP POLICY IF EXISTS "Users can create shops" ON shops;
DROP POLICY IF EXISTS "Users can update own shops" ON shops;
DROP POLICY IF EXISTS "Users can delete own shops" ON shops;
DROP POLICY IF EXISTS "Anonymous users can view approved shops" ON shops;
DROP POLICY IF EXISTS "Admins can view all shops" ON shops;
DROP POLICY IF EXISTS "Admins can update all shops" ON shops;

-- Politique 1: Permettre aux utilisateurs authentifiés de créer leur propre boutique
CREATE POLICY "Enable create for authenticated users" ON shops
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Politique 2: Permettre aux utilisateurs de voir leur propre boutique
CREATE POLICY "Enable read for users on own shops" ON shops
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Politique 3: Permettre aux utilisateurs de mettre à jour leur propre boutique
CREATE POLICY "Enable update for users on own shops" ON shops
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politique 4: Permettre à tout le monde de voir les boutiques approuvées
CREATE POLICY "Enable read for all on approved shops" ON shops
    FOR SELECT
    TO anon, authenticated
    USING (status = 'approved');

-- Politique 5: Permettre aux admins de tout faire sur toutes les boutiques
-- Note: Cette politique nécessite que la table users ait un champ role
CREATE POLICY "Enable all for admins" ON shops
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Politique 6: Permettre aux utilisateurs authentifiés de voir toutes les boutiques en attente
-- (pour les pages d'admin où on montre les boutiques en attente)
CREATE POLICY "Enable read for authenticated on pending shops" ON shops
    FOR SELECT
    TO authenticated
    USING (status = 'pending');

-- Simplification: Permettre aux utilisateurs authentifiés de voir toutes les boutiques
-- (à des fins de débogage et de développement)
CREATE POLICY "Enable read for all authenticated users" ON shops
    FOR SELECT
    TO authenticated
    USING (true);