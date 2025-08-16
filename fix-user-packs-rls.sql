-- Script pour corriger les politiques RLS sur user_packs et user_services

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own packs" ON user_packs;
DROP POLICY IF EXISTS "Users can insert own packs" ON user_packs;
DROP POLICY IF EXISTS "Users can update own packs" ON user_packs;
DROP POLICY IF EXISTS "Users can create own packs" ON user_packs;
DROP POLICY IF EXISTS "Admins can manage all user packs" ON user_packs;

DROP POLICY IF EXISTS "Users can view their own services" ON user_services;
DROP POLICY IF EXISTS "Users can update their own service stats" ON user_services;
DROP POLICY IF EXISTS "Users can insert own services" ON user_services;
DROP POLICY IF EXISTS "Admins can manage all user services" ON user_services;

-- Créer les nouvelles politiques pour user_packs
CREATE POLICY "Users can view own packs" ON user_packs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own packs" ON user_packs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packs" ON user_packs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user packs" ON user_packs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Créer les nouvelles politiques pour user_services
CREATE POLICY "Users can view their own services" ON user_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services" ON user_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service stats" ON user_services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user services" ON user_services
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- S'assurer que RLS est activé
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;

-- Afficher les politiques créées
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_packs', 'user_services')
ORDER BY tablename, policyname;