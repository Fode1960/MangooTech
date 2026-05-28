-- Migration pour vérifier et corriger les permissions de la table shops
-- Cette migration s'assure que les rôles appropriés ont les bonnes permissions

-- Vérifier et accorder les permissions pour le rôle 'anon' (utilisateurs non authentifiés)
GRANT SELECT ON public.shops TO anon;

-- Vérifier et accorder les permissions pour le rôle 'authenticated' (utilisateurs authentifiés)
GRANT ALL ON public.shops TO authenticated;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to insert shops" ON public.shops;
DROP POLICY IF EXISTS "Allow everyone to read approved shops" ON public.shops;
DROP POLICY IF EXISTS "Allow users to read their own shops" ON public.shops;
DROP POLICY IF EXISTS "Allow users to update their own shops" ON public.shops;

-- Créer une politique RLS pour permettre l'insertion de boutiques aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to insert shops" ON public.shops
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Créer une politique RLS pour permettre la lecture de toutes les boutiques approuvées
CREATE POLICY "Allow everyone to read approved shops" ON public.shops
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

-- Créer une politique RLS pour permettre aux utilisateurs de lire leurs propres boutiques
CREATE POLICY "Allow users to read their own shops" ON public.shops
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Créer une politique RLS pour permettre aux utilisateurs de mettre à jour leurs propres boutiques
CREATE POLICY "Allow users to update their own shops" ON public.shops
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Afficher les permissions actuelles pour débogage
SELECT 
    table_schema,
    table_name, 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'shops' 
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;