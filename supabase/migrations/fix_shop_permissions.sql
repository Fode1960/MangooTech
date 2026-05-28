-- Migration pour corriger les permissions RLS de la table shops
-- Cette migration ajoute les politiques nécessaires pour permettre aux admins de voir toutes les boutiques

-- Politique pour permettre aux utilisateurs authentifiés de voir leur propre boutique
CREATE POLICY "Users can view own shops" ON shops
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs authentifiés de créer des boutiques
CREATE POLICY "Users can create shops" ON shops
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs authentifiés de mettre à jour leur propre boutique
CREATE POLICY "Users can update own shops" ON shops
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs authentifiés de supprimer leur propre boutique
CREATE POLICY "Users can delete own shops" ON shops
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs anonymes de voir les boutiques approuvées
CREATE POLICY "Anonymous users can view approved shops" ON shops
    FOR SELECT
    TO anon
    USING (status = 'approved');

-- Politique pour permettre aux admins de voir toutes les boutiques (nécessite une fonction personnalisée)
CREATE POLICY "Admins can view all shops" ON shops
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Politique pour permettre aux admins de mettre à jour toutes les boutiques
CREATE POLICY "Admins can update all shops" ON shops
    FOR UPDATE
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