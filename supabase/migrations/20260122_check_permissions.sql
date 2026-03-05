-- Vérifier les politiques existantes sur la table shops
SELECT policyname, cmd, roles::regrole[], qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'shops';

-- Vérifier les permissions directes
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'shops' 
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;