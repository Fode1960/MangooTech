-- Migration pour corriger les permissions d'insertion dans la table shops
-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Enable create for authenticated users" ON shops;
DROP POLICY IF EXISTS "Enable read for users on own shops" ON shops;
DROP POLICY IF EXISTS "Enable update for users on own shops" ON shops;
DROP POLICY IF EXISTS "Enable read for all on approved shops" ON shops;
DROP POLICY IF EXISTS "Enable all for admins" ON shops;
DROP POLICY IF EXISTS "Enable read for authenticated on pending shops" ON shops;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON shops;

-- Politique simple: permettre aux utilisateurs authentifiés de créer des boutiques avec leur propre user_id
CREATE POLICY "Allow authenticated users to create shops" ON shops
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Politique: permettre aux utilisateurs de voir leur propres boutiques
CREATE POLICY "Allow users to read own shops" ON shops
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Politique: permettre aux utilisateurs de mettre à jour leur propres boutiques
CREATE POLICY "Allow users to update own shops" ON shops
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politique: permettre à tout le monde de voir les boutiques approuvées
CREATE POLICY "Allow everyone to read approved shops" ON shops
    FOR SELECT
    TO anon, authenticated
    USING (status = 'approved');

-- Politique: permettre aux utilisateurs authentifiés de voir toutes les boutiques en attente
-- (nécessaire pour l'interface admin qui montre les boutiques en attente)
CREATE POLICY "Allow authenticated to read pending shops" ON shops
    FOR SELECT
    TO authenticated
    USING (status = 'pending');

-- Politique: permettre aux utilisateurs authentifiés de voir toutes les boutiques
-- (simplification pour le développement - à restreindre en production)
CREATE POLICY "Allow authenticated to read all shops" ON shops
    FOR SELECT
    TO authenticated
    USING (true);