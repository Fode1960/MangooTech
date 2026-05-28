-- Migration pour corriger les politiques RLS sur la table shops
-- Mettre à jour les politiques pour utiliser le nouveau système admin

-- Supprimer les anciennes politiques qui utilisent le système obsolète
DROP POLICY IF EXISTS "Enable all for admins" ON shops;
DROP POLICY IF EXISTS "Enable status update for admin" ON shops;

-- Créer une nouvelle politique pour permettre aux admins de tout faire sur toutes les boutiques
-- Utilise le nouveau système admin avec admin_users et admin_roles
CREATE POLICY "Enable all for admins - new system" ON shops
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM admin_users au
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid()
            AND au.is_active = TRUE
            AND (au.expires_at IS NULL OR au.expires_at > NOW())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM admin_users au
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid()
            AND au.is_active = TRUE
            AND (au.expires_at IS NULL OR au.expires_at > NOW())
        )
    );

-- Politique spécifique pour la mise à jour du statut (approbation/rejet)
CREATE POLICY "Enable status update for admins - new system" ON shops
    FOR UPDATE
    TO authenticated
    USING (
        status IN ('pending', 'approved', 'rejected', 'suspended')
        AND EXISTS (
            SELECT 1 
            FROM admin_users au
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid()
            AND au.is_active = TRUE
            AND (au.expires_at IS NULL OR au.expires_at > NOW())
        )
    )
    WITH CHECK (
        status IN ('pending', 'approved', 'rejected', 'suspended')
        AND EXISTS (
            SELECT 1 
            FROM admin_users au
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid()
            AND au.is_active = TRUE
            AND (au.expires_at IS NULL OR au.expires_at > NOW())
        )
    );

-- S'assurer que les permissions sont accordées
GRANT SELECT ON shops TO authenticated;
GRANT UPDATE ON shops TO authenticated;
GRANT INSERT ON shops TO authenticated;
GRANT DELETE ON shops TO authenticated;