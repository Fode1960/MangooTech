-- Vérifier la structure de notre système admin
-- Vérifier si la table admins existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'admins';

-- Vérifier si la fonction is_user_admin existe
SELECT proname, prosrc
FROM pg_proc 
WHERE proname = 'is_user_admin';

-- Tester la fonction
SELECT is_user_admin('00000000-0000-0000-0000-000000000000');