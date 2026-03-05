-- Test: Créer une politique temporaire très permissive pour identifier le problème
-- Cette politique sera supprimée après le test

-- Supprimer la politique restrictive si elle existe
DROP POLICY IF EXISTS "Allow shop owners and admins to update shops" ON public.shops;

-- Créer une politique temporaire très permissive
CREATE POLICY "Test permissive update policy" ON public.shops
FOR UPDATE TO authenticated
USING (true)  -- Tout le monde peut tout voir
WITH CHECK (true);  -- Tout le monde peut tout modifier

-- S'assurer que les permissions de base sont correctes
GRANT ALL ON public.shops TO authenticated;
GRANT SELECT ON public.shops TO anon;