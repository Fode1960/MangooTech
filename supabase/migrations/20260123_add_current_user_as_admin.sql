-- Migration: Ajouter l'utilisateur mdansoko@mangoo.tech comme admin
-- Date: 2026-01-23
-- Description: Ajoute l'utilisateur principal comme administrateur

-- Vérifier si l'utilisateur existe et l'ajouter comme admin s'il ne l'est pas
INSERT INTO admin_users (user_id, role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 
    u.id,
    (SELECT id FROM admin_roles WHERE name = 'admin' ORDER BY level DESC LIMIT 1),
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

-- Afficher le résultat
SELECT u.id, u.email, au.is_active, ar.name as role_name, ar.level, ar.permissions
FROM users u
LEFT JOIN admin_users au ON u.id = au.user_id AND au.is_active = true
LEFT JOIN admin_roles ar ON au.role_id = ar.id
WHERE u.email = 'mdansoko@mangoo.tech';