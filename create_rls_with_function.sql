-- Créer des politiques RLS basées sur la fonction is_user_admin

-- Supprimer la politique temporaire
DROP POLICY IF EXISTS "Test permissive update policy" ON public.shops;

-- Politique pour permettre aux admins de tout faire sur les boutiques
CREATE POLICY "Allow admins full access to shops" ON public.shops
FOR ALL TO authenticated
USING (
  is_user_admin(auth.uid()) = true
)
WITH CHECK (
  is_user_admin(auth.uid()) = true
);

-- Politique pour permettre aux propriétaires de boutiques de voir leurs propres boutiques
CREATE POLICY "Allow shop owners to view their own shops" ON public.shops
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  is_user_admin(auth.uid()) = true
);

-- Politique pour permettre aux propriétaires de créer des boutiques
CREATE POLICY "Allow authenticated users to create shops" ON public.shops
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Politique pour permettre aux propriétaires de modifier leurs propres boutiques (sauf le statut)
CREATE POLICY "Allow shop owners to update their own shops" ON public.shops
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  status = (SELECT status FROM public.shops WHERE id = shops.id)
);