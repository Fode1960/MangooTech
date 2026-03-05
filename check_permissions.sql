-- Vérifier les permissions actuelles sur la table shops
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'shops' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY grantee, privilege_type;

-- Vérifier les politiques RLS existantes
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'shops'
ORDER BY policyname;