-- Vérifier les politiques RLS actuelles sur la table shops
SELECT 
    polname as policy_name,
    polcmd as command,
    polroles::regrole[] as roles,
    polqual as using_expression,
    polwithcheck as with_check_expression
FROM pg_policies 
WHERE tablename = 'shops' 
AND schemaname = 'public'
ORDER BY policy_name;

-- Vérifier les permissions accordées
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'shops'
ORDER BY grantee, privilege_type;

-- Vérifier la structure de la table shops
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'shops'
ORDER BY ordinal_position;