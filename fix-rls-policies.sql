-- Script pour corriger les politiques RLS et permettre la création de profils
-- À exécuter dans l'éditeur SQL de Supabase Dashboard

-- 1. Supprimer les politiques existantes pour la table users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 2. Créer de nouvelles politiques plus permissives pour la table users
-- Permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Permettre l'insertion de nouveaux profils (pour le trigger automatique)
CREATE POLICY "Enable insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (true);

-- 3. Vérifier que le trigger fonctionne correctement
-- Si le trigger automatique ne fonctionne pas, on peut aussi permettre l'insertion manuelle
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Politique pour permettre aux services d'être gérés par des administrateurs
-- (optionnel, pour plus tard)
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Services are viewable by everyone" ON public.services
    FOR SELECT USING (true);

-- Permettre l'insertion de services (pour les administrateurs ou le système)
CREATE POLICY "Enable insert for services" ON public.services
    FOR INSERT WITH CHECK (true);

-- 5. Corriger les politiques pour les subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Corriger les politiques pour les contacts
DROP POLICY IF EXISTS "Anyone can create contacts" ON public.contacts;
CREATE POLICY "Anyone can create contacts" ON public.contacts
    FOR INSERT WITH CHECK (true);

-- Script terminé - Les politiques RLS sont maintenant corrigées !