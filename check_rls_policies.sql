-- Vérifier les politiques RLS actuelles sur la table shops
SELECT 
    polname as policy_name,
    polcmd as command,
    polroles::regrole[] as roles,
    polqual as using_expression,
    polwithcheck as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'shops'
ORDER BY policy_name;