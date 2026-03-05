-- Vérifier si la fonction is_user_admin existe et fonctionne
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_user_admin';

-- Tester la fonction avec un ID d'utilisateur
SELECT is_user_admin('00000000-0000-0000-0000-000000000000');

-- Vérifier les permissions actuelles
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'shops' 
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;