-- Migration pour créer une politique RLS spéciale pour l'admin
-- Permettre à l'admin de créer des boutiques sans restriction

-- Créer une politique spéciale pour l'admin qui permet toutes les opérations
DROP POLICY IF EXISTS "Allow admin full access to shops" ON public.shops;

CREATE POLICY "Allow admin full access to shops" ON public.shops
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- S'assurer que RLS est activé
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Forcer l'application des politiques RLS
ALTER TABLE public.shops FORCE ROW LEVEL SECURITY;