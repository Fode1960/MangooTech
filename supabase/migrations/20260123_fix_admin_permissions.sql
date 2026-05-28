-- Migration: Corriger les permissions admin pour permettre la mise à jour du statut
-- Date: 2026-01-23
-- Description: Remplace la politique trop restrictive qui empêchait les admins de mettre à jour les statuts

-- Supprimer la politique trop restrictive qui empêche les admins de mettre à jour
DROP POLICY IF EXISTS "Allow shop owners to update their shops except status" ON public.shops;

-- Créer une politique qui permet aux propriétaires de mettre à jour leur boutique (sauf le statut) ET aux admins de tout faire
CREATE POLICY "Allow shop owners and admins to update shops" ON public.shops
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id -- Propriétaire peut tout mettre à jour
  OR is_user_admin(auth.uid()) -- Admin peut tout faire
)
WITH CHECK (
  (auth.uid() = user_id AND status = (SELECT status FROM public.shops WHERE id = shops.id)) -- Propriétaire ne peut pas changer le statut
  OR is_user_admin(auth.uid()) -- Admin peut tout faire, y compris changer le statut
);

-- S'assurer que l'admin a bien toutes les permissions nécessaires
GRANT UPDATE ON public.shops TO authenticated;