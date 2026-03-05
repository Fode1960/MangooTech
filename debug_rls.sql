-- Vérifier toutes les politiques sur la table shops
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'shops'
ORDER BY policyname;

-- Vérifier si RLS est activé
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'shops' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Vérifier les permissions de base
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'shops' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY grantee, privilege_type;