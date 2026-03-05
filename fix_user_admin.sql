-- Vérifier si l'utilisateur avec email mdansoko@mangoo.tech est admin
-- et ajouter l'utilisateur comme admin s'il ne l'est pas

-- D'abord, obtenir l'ID de l'utilisateur
SELECT id, email, full_name 
FROM users 
WHERE email = 'mdansoko@mangoo.tech';

-- Vérifier si l'utilisateur est admin
SELECT u.id, u.email, au.is_active, ar.name as role_name, ar.level, ar.permissions
FROM users u
LEFT JOIN admin_users au ON u.id = au.user_id
LEFT JOIN admin_roles ar ON au.role_id = ar.id
WHERE u.email = 'mdansoko@mangoo.tech';

-- Si l'utilisateur n'est pas admin, l'ajouter comme admin
-- (décommenter et exécuter si nécessaire)
/*
INSERT INTO admin_users (user_id, role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 
    u.id,
    (SELECT id FROM admin_roles WHERE name = 'admin' LIMIT 1),
    NULL,
    NOW(),
    true,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'mdansoko@mangoo.tech'
AND NOT EXISTS (
    SELECT 1 FROM admin_users au2 
    WHERE au2.user_id = u.id 
    AND au2.is_active = true
);
*/