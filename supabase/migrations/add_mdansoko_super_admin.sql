-- Script pour ajouter mdansoko@hotmail.com comme super admin
-- Utilisateur ID: d66d4212-f91b-4e7c-9944-892d5f73a0bc

-- Vérifier d'abord si l'utilisateur existe dans la table users
SELECT id, email, role FROM users WHERE email = 'mdansoko@hotmail.com';

-- Vérifier les rôles admin disponibles
SELECT id, name, description, level, permissions FROM admin_roles ORDER BY level DESC;

-- Si le rôle super_admin n'existe pas, le créer
INSERT INTO admin_roles (name, description, level, permissions) VALUES 
('super_admin', 'Super Administrateur - Accès complet', 100, '["*"]')
ON CONFLICT (name) DO NOTHING;

-- Obtenir l'ID du rôle super_admin
SELECT id FROM admin_roles WHERE name = 'super_admin';

-- D'abord, supprimer l'entrée existante si elle existe
DELETE FROM admin_users WHERE user_id = 'd66d4212-f91b-4e7c-9944-892d5f73a0bc';

-- Ajouter l'utilisateur comme super admin
INSERT INTO admin_users (user_id, role_id, is_active, created_at, updated_at)
SELECT 
    'd66d4212-f91b-4e7c-9944-892d5f73a0bc' as user_id,
    (SELECT id FROM admin_roles WHERE name = 'super_admin') as role_id,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at;

-- Vérifier que l'utilisateur est maintenant super admin
SELECT 
    au.user_id,
    u.email,
    ar.name as role_name,
    ar.level,
    ar.permissions,
    au.is_active,
    au.created_at
FROM admin_users au
JOIN users u ON au.user_id = u.id
JOIN admin_roles ar ON au.role_id = ar.id
WHERE au.user_id = 'd66d4212-f91b-4e7c-9944-892d5f73a0bc';

-- Optionnel: Mettre aussi à jour le champ role dans users (pour compatibilité)
UPDATE users 
SET role = 'super_admin', updated_at = NOW()
WHERE id = 'd66d4212-f91b-4e7c-9944-892d5f73a0bc';

-- Vérification finale
SELECT id, email, role FROM users WHERE id = 'd66d4212-f91b-4e7c-9944-892d5f73a0bc';