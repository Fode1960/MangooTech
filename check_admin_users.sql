-- Query to check current admin users and their roles
SELECT 
    au.id as admin_user_id,
    au.user_id,
    au.is_active,
    au.created_at as admin_created_at,
    u.email,
    u.first_name,
    u.last_name,
    ar.name as role_name,
    ar.level as role_level,
    ar.permissions as role_permissions
FROM admin_users au
JOIN users u ON au.user_id = u.id
JOIN admin_roles ar ON au.role_id = ar.id
WHERE au.is_active = TRUE
ORDER BY au.created_at DESC;