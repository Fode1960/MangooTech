-- Migration: Sécuriser le champ status des boutiques
-- Date: 2026-01-23
-- Description: Empêche les utilisateurs de modifier le statut de leur propre boutique, seul l'administrateur peut changer le statut

-- Supprimer les anciennes politiques qui pourraient entrer en conflit
DROP POLICY IF EXISTS "Allow shop owners to update their shops except status" ON public.shops;
DROP POLICY IF EXISTS "Allow shop owners to create shops with pending status" ON public.shops;
DROP POLICY IF EXISTS "Allow shop owners to read their own shops" ON public.shops;
DROP POLICY IF EXISTS "Allow public to read approved shops" ON public.shops;
DROP POLICY IF EXISTS "Allow authenticated to read pending shops" ON public.shops;
DROP POLICY IF EXISTS "Allow admin to manage all shops" ON public.shops;

-- Créer une politique qui permet aux propriétaires de mettre à jour leur boutique SAUF le champ status
CREATE POLICY "Allow shop owners to update their shops except status" ON public.shops
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND status = (SELECT status FROM public.shops WHERE id = shops.id) -- Empêche la modification du statut
);

-- Politique spécifique pour permettre aux propriétaires de créer des boutiques avec le statut 'pending'
CREATE POLICY "Allow shop owners to create shops with pending status" ON public.shops
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending' -- Seul le statut 'pending' est autorisé lors de la création
);

-- Politique pour permettre aux propriétaires de lire leurs propres boutiques
CREATE POLICY "Allow shop owners to read their own shops" ON public.shops
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Politique pour permettre à tout le monde de lire les boutiques approuvées
CREATE POLICY "Allow public to read approved shops" ON public.shops
FOR SELECT TO anon, authenticated
USING (status = 'approved');

-- Politique pour permettre aux utilisateurs authentifiés de lire les boutiques en attente (pour leur dashboard)
CREATE POLICY "Allow authenticated to read pending shops" ON public.shops
FOR SELECT TO authenticated
USING (status = 'pending');

-- S'assurer que l'administrateur peut toujours tout faire
CREATE POLICY "Allow admin to manage all shops" ON public.shops
FOR ALL TO authenticated
USING (is_user_admin(auth.uid()));