-- Script pour corriger les politiques RLS et permettre la migration vers le pack gratuit
-- À exécuter dans l'interface Supabase : https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql

-- =====================================================
-- CORRECTION DES POLITIQUES RLS POUR USER_PACKS
-- =====================================================

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can insert own packs" ON user_packs;
DROP POLICY IF EXISTS "Users can view own packs" ON user_packs;
DROP POLICY IF EXISTS "Users can update own packs" ON user_packs;

-- Créer les nouvelles politiques plus permissives

-- Politique d'insertion : permettre aux utilisateurs d'insérer leurs propres packs
CREATE POLICY "Users can insert own packs" ON user_packs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique de lecture : permettre aux utilisateurs de voir leurs propres packs
CREATE POLICY "Users can view own packs" ON user_packs
    FOR SELECT USING (auth.uid() = user_id);

-- Politique de mise à jour : permettre aux utilisateurs de modifier leurs propres packs
CREATE POLICY "Users can update own packs" ON user_packs
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- VÉRIFICATION DES POLITIQUES
-- =====================================================

-- Afficher les politiques actuelles pour vérification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_packs';

-- =====================================================
-- TEST D'INSERTION (OPTIONNEL)
-- =====================================================

-- Tester l'insertion d'un pack gratuit pour l'utilisateur actuel
-- (Décommentez les lignes suivantes pour tester)

/*
-- Récupérer l'ID du pack gratuit
DO $$
DECLARE
    free_pack_id UUID;
    current_user_id UUID;
BEGIN
    -- Récupérer l'ID du pack gratuit
    SELECT id INTO free_pack_id FROM packs WHERE price = 0 LIMIT 1;
    
    -- Récupérer l'ID de l'utilisateur actuel
    SELECT auth.uid() INTO current_user_id;
    
    -- Afficher les informations
    RAISE NOTICE 'Pack gratuit ID: %', free_pack_id;
    RAISE NOTICE 'Utilisateur actuel ID: %', current_user_id;
    
    -- Tenter l'insertion (sera annulée par ROLLBACK)
    IF free_pack_id IS NOT NULL AND current_user_id IS NOT NULL THEN
        INSERT INTO user_packs (
            user_id,
            pack_id,
            status,
            started_at
        ) VALUES (
            current_user_id,
            free_pack_id,
            'active',
            NOW()
        );
        
        RAISE NOTICE 'Test d''insertion réussi !';
        
        -- Annuler l'insertion de test
        ROLLBACK;
    ELSE
        RAISE NOTICE 'Impossible de tester : pack gratuit ou utilisateur non trouvé';
    END IF;
END $$;
*/

-- =====================================================
-- RÉSUMÉ
-- =====================================================

SELECT '✅ Politiques RLS corrigées pour user_packs' as message;
SELECT 'ℹ️ La fonction cancel-subscription devrait maintenant pouvoir migrer vers le pack gratuit' as info;
SELECT 'ℹ️ Testez l''annulation immédiate depuis l''interface utilisateur' as next_step;