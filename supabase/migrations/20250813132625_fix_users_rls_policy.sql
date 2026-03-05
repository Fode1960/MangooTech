-- Ajouter la politique manquante pour permettre aux utilisateurs de créer leur propre profil
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);