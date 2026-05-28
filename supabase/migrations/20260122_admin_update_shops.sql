-- Politique pour permettre aux administrateurs de mettre à jour toutes les boutiques
CREATE POLICY "Allow admin to update all shops" ON public.shops
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
);

-- Politique pour permettre aux administrateurs de mettre à jour le statut des boutiques
CREATE POLICY "Allow admin to update shop status" ON public.shops
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
);

-- S'assurer que les administrateurs ont accès à toutes les colonnes
GRANT UPDATE ON public.shops TO authenticated;