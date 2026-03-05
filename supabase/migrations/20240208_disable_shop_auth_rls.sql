-- Migration pour désactiver temporairement RLS sur shop_auth
-- Cela permettra la création initiale des authentifications

-- Désactiver RLS temporairement
ALTER TABLE shop_auth DISABLE ROW LEVEL SECURITY;

-- S'assurer que les permissions sont correctement accordées
GRANT ALL ON shop_auth TO authenticated;
GRANT ALL ON shop_auth TO anon;
GRANT ALL ON shop_auth TO service_role;