-- Ajouter les politiques RLS manquantes pour permettre l'inscription

-- Politique pour permettre aux utilisateurs de créer leur propre profil
CREATE POLICY IF NOT EXISTS "Users can create own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de créer leurs propres packs
CREATE POLICY IF NOT EXISTS "Users can create own packs" ON public.user_packs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de voir leurs propres packs
CREATE POLICY IF NOT EXISTS "Users can view own packs" ON public.user_packs
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres packs
CREATE POLICY IF NOT EXISTS "Users can update own packs" ON public.user_packs
FOR UPDATE USING (auth.uid() = user_id);

SELECT 'Politiques RLS ajoutées avec succès' as result;