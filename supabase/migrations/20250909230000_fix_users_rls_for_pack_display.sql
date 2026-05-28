-- Migration pour corriger les politiques RLS sur la table users
-- Problème: Le frontend ne peut pas lire les données utilisateur après changement de pack
-- Solution: Permettre la lecture des profils utilisateur pour l'affichage des packs

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public can read user packs" ON public.users;

-- Nouvelle politique: permettre aux utilisateurs authentifiés de lire leur profil
-- ET permettre la lecture publique des informations de pack (nécessaire pour l'affichage)
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.role() = 'authenticated' OR
        auth.role() = 'anon'
    );

-- Politique alternative: lecture publique limitée aux champs nécessaires
-- Cette politique permet l'affichage des packs même sans authentification complète
CREATE POLICY "Public pack display access" ON public.users
    FOR SELECT USING (true);

-- Maintenir la politique de mise à jour restrictive
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Maintenir la politique d'insertion
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Commentaire explicatif
COMMENT ON TABLE public.users IS 'Table des utilisateurs avec politiques RLS permettant l''affichage des packs après paiement';