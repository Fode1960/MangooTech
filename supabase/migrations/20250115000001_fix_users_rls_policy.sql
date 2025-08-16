-- Ajouter la politique manquante pour permettre aux utilisateurs de créer leur propre profil
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Ajouter une politique pour permettre l'insertion dans user_packs
CREATE POLICY "Users can create own packs" ON public.user_packs
    FOR INSERT WITH CHECK (auth.uid() = user_id);