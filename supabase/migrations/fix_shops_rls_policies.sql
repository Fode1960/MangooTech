-- Migration pour corriger les politiques RLS de la table shops
-- Permettre l'insertion de boutiques sans restriction d'utilisateur pour l'admin

-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Allow authenticated users to insert shops" ON public.shops;
DROP POLICY IF EXISTS "Allow users to read their own shops" ON public.shops;
DROP POLICY IF EXISTS "Allow users to update their own shops" ON public.shops;

-- Créer une politique plus permissive pour l'insertion (nécessaire pour l'admin)
CREATE POLICY "Allow authenticated users to insert shops" ON public.shops
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Créer une politique pour lire toutes les boutiques (y compris en attente)
CREATE POLICY "Allow everyone to read shops" ON public.shops
    FOR SELECT TO anon, authenticated
    USING (true);

-- Créer une politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to update shops" ON public.shops
    FOR UPDATE TO authenticated
    USING (true);

-- Créer une politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to delete shops" ON public.shops
    FOR DELETE TO authenticated
    USING (true);

-- S'assurer que les permissions sont correctement définies
GRANT ALL ON public.shops TO authenticated;
GRANT SELECT ON public.shops TO anon;