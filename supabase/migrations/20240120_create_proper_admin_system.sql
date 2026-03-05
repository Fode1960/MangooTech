-- Migration pour créer un système admin permanent et professionnel
-- Cette migration remplace la solution temporaire par un système robuste

-- Étape 1: Créer une table pour les rôles admin avec plus de structure
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    level INTEGER DEFAULT 1,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Étape 2: Créer une table pour lier les utilisateurs aux rôles admin
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Étape 3: Créer une table pour l'historique des actions admin
CREATE TABLE IF NOT EXISTS admin_action_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Étape 4: Insérer les rôles admin par défaut
INSERT INTO admin_roles (name, description, level, permissions) VALUES
('super_admin', 'Super Administrateur - Accès complet', 100, '["*"]'),
('admin', 'Administrateur - Gestion complète', 90, '["manage_shops", "manage_users", "manage_orders", "manage_products", "view_analytics", "manage_categories"]'),
('moderator', 'Modérateur - Gestion modérée', 70, '["manage_shops", "view_users", "manage_orders", "view_analytics"]'),
('support', 'Support - Vue seule', 50, '["view_shops", "view_users", "view_orders", "view_analytics"]');

-- Étape 5: Créer des fonctions utilitaires
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_users au
        JOIN admin_roles ar ON au.role_id = ar.id
        WHERE au.user_id = p_user_id 
        AND au.is_active = TRUE
        AND (au.expires_at IS NULL OR au.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_admin_permissions(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT JSONB_AGG(DISTINCT perm)
        FROM admin_users au
        JOIN admin_roles ar ON au.role_id = ar.id
        CROSS JOIN JSONB_ARRAY_ELEMENTS(ar.permissions) AS perm
        WHERE au.user_id = p_user_id 
        AND au.is_active = TRUE
        AND (au.expires_at IS NULL OR au.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_admin_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_users au
        JOIN admin_roles ar ON au.role_id = ar.id
        WHERE au.user_id = p_user_id 
        AND au.is_active = TRUE
        AND (au.expires_at IS NULL OR au.expires_at > NOW())
        AND (
            ar.permissions @> '["*"]'::jsonb 
            OR ar.permissions @> ('["' || p_permission || '"]')::jsonb
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 6: Créer des politiques RLS pour les tables admin
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_log ENABLE ROW LEVEL SECURITY;

-- Politiques pour admin_roles (lecture publique, écriture admin)
CREATE POLICY "Enable read for all users" ON admin_roles
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Enable write for super admins" ON admin_roles
    FOR ALL
    TO authenticated
    USING (has_admin_permission(auth.uid(), 'manage_admins'))
    WITH CHECK (has_admin_permission(auth.uid(), 'manage_admins'));

-- Politiques pour admin_users (admin seulement)
CREATE POLICY "Enable read for admins" ON admin_users
    FOR SELECT
    TO authenticated
    USING (has_admin_permission(auth.uid(), 'manage_admins') OR is_user_admin(auth.uid()));

CREATE POLICY "Enable write for super admins" ON admin_users
    FOR ALL
    TO authenticated
    USING (has_admin_permission(auth.uid(), 'manage_admins'))
    WITH CHECK (has_admin_permission(auth.uid(), 'manage_admins'));

-- Politiques pour admin_action_log (admin seulement)
CREATE POLICY "Enable read for admins" ON admin_action_log
    FOR SELECT
    TO authenticated
    USING (has_admin_permission(auth.uid(), 'view_logs'));

CREATE POLICY "Enable write for admins" ON admin_action_log
    FOR INSERT
    TO authenticated
    WITH CHECK (is_user_admin(auth.uid()));

-- Étape 7: Accorder les permissions
GRANT SELECT ON admin_roles TO anon, authenticated;
GRANT ALL ON admin_roles TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT ALL ON admin_users TO authenticated;
GRANT SELECT ON admin_action_log TO authenticated;
GRANT INSERT ON admin_action_log TO authenticated;

-- Étape 8: Créer un trigger pour mettre à jour la colonne updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_roles_updated_at
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();