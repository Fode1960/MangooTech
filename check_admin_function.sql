-- Vérifier si la fonction is_user_admin existe
SELECT proname, proargtypes, prosrc
FROM pg_proc 
WHERE proname = 'is_user_admin';

-- Tester la fonction avec un ID d'utilisateur
SELECT is_user_admin('00000000-0000-0000-0000-000000000000');