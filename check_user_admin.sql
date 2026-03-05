-- Vérifier si l'utilisateur mdansoko@mangoo.tech est admin
SELECT u.id, u.email, au.is_active, ar.name as role_name, ar.level
FROM users u
LEFT JOIN admin_users au ON u.id = au.user_id
LEFT JOIN admin_roles ar ON au.role_id = ar.id
WHERE u.email = 'mdansoko@mangoo.tech';