-- Test: Politique ultra-permissive pour identifier le problème
-- Cette politique sera supprimée après le diagnostic

-- Supprimer toutes les politiques existantes sur shops
DROP POLICY IF EXISTS "Allow admins full access to shops" ON public.shops;
DROP POLICY IF EXISTS "Allow shop owners to view their own shops" ON public.shops;
DROP POLICY IF EXISTS "Allow authenticated users to create shops" ON public.shops;
DROP POLICY IF EXISTS "Allow shop owners to update their own shops" ON public.shops;
DROP POLICY IF EXISTS "Test permissive update policy" ON public.shops;

-- Créer une politique unique ultra-permissive
CREATE POLICY "Ultra permissive test policy" ON public.shops
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- S'assurer que les permissions de base sont maximales
GRANT ALL ON public.shops TO authenticated;
GRANT ALL ON public.shops TO anon;