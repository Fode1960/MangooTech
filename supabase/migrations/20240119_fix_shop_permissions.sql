-- Migration pour corriger les permissions RLS sur la table shops
-- Cette migration résout l'erreur 406 lors de l'approbation/rejet des boutiques

-- Supprimer les anciennes politiques RLS s'ils existent
DROP POLICY IF EXISTS "Enable read access for all users" ON public.shops;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.shops;
DROP POLICY IF EXISTS "Enable update for shop owners" ON public.shops;
DROP POLICY IF EXISTS "Enable delete for shop owners" ON public.shops;

-- Politique pour permettre la lecture de toutes les boutiques actives
CREATE POLICY "Enable read access for active shops" ON public.shops
    FOR SELECT
    USING (status = 'active');

-- Politique pour permettre la lecture de toutes les boutiques aux utilisateurs authentifiés
CREATE POLICY "Enable read access for authenticated users" ON public.shops
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Enable insert for authenticated users" ON public.shops
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre la mise à jour au propriétaire de la boutique
CREATE POLICY "Enable update for shop owners" ON public.shops
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre la mise à jour du statut à l'administrateur
CREATE POLICY "Enable status update for admin" ON public.shops
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email LIKE '%@mangoo.tech'
        )
    )
    WITH CHECK (
        status IN ('pending', 'approved', 'rejected', 'suspended')
        AND EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email LIKE '%@mangoo.tech'
        )
    );

-- Politique pour permettre la suppression au propriétaire de la boutique
CREATE POLICY "Enable delete for shop owners" ON public.shops
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Accorder les permissions nécessaires aux rôles
GRANT SELECT ON public.shops TO anon, authenticated;
GRANT INSERT ON public.shops TO authenticated;
GRANT UPDATE ON public.shops TO authenticated;
GRANT DELETE ON public.shops TO authenticated;