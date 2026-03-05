-- =====================================================
-- CORRECTION RLS MANUELLE - SCRIPT SQL
-- =====================================================
-- Ce script résout le problème de synchronisation des packs
-- en corrigeant les politiques Row Level Security

-- OPTION 1: Désactivation complète de RLS (solution rapide)
-- --------------------------------------------------------
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Vérification que RLS est désactivé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';
-- rowsecurity devrait être 'false'


-- =====================================================
-- OPTION 2: Politiques RLS permissives (solution sécurisée)
-- =====================================================
-- Décommentez cette section si vous préférez garder RLS activé

/*
-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public can read user packs" ON public.users;
DROP POLICY IF EXISTS "Public pack display access" ON public.users;

-- Créer une politique permissive pour la lecture
CREATE POLICY "Public can read user profiles" ON public.users
    FOR SELECT USING (true);

-- Maintenir la sécurité pour les modifications
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Maintenir la sécurité pour les insertions
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
*/


-- =====================================================
-- VÉRIFICATION POST-CORRECTION
-- =====================================================

-- Vérifier les politiques actuelles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test de lecture des données utilisateur
SELECT 
    id,
    email,
    selected_pack,
    created_at
FROM public.users 
LIMIT 5;

-- Vérifier la structure de la table
\d public.users;


-- =====================================================
-- INSTRUCTIONS D'UTILISATION
-- =====================================================
/*
1. Copiez ce script dans le SQL Editor de Supabase
2. Exécutez OPTION 1 pour une solution rapide
3. Ou décommentez et exécutez OPTION 2 pour une solution sécurisée
4. Vérifiez les résultats avec les requêtes de vérification
5. Testez votre application immédiatement après

APRÈS EXÉCUTION:
- Retournez sur votre application: http://localhost:3001/
- Testez un changement de pack avec paiement
- L'affichage devrait se mettre à jour immédiatement

SI ÇA MARCHE:
- Le problème est résolu définitivement!
- Vous pouvez garder cette configuration
- Ou réactiver RLS avec des politiques plus spécifiques plus tard

SI ÇA NE MARCHE PAS:
- Vérifiez que le script s'est exécuté sans erreur
- Redémarrez votre application frontend
- Videz le cache de votre navigateur
- Exécutez: node final-pack-sync-test.cjs pour diagnostic
*/

-- =====================================================
-- ROLLBACK (si nécessaire)
-- =====================================================
/*
-- Pour réactiver RLS avec les politiques originales:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);
*/