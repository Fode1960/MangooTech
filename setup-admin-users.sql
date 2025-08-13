-- Script pour configurer la gestion des utilisateurs administrateurs

-- 1. Ajouter une colonne 'role' à la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- 2. Créer un index sur la colonne role pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 3. Créer une table pour gérer les permissions des administrateurs
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    granted_by UUID REFERENCES public.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(admin_id, permission)
);

-- 4. Créer une table pour l'audit des actions administrateurs
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour vérifier si un utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION public.has_admin_permission(user_id UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admin a toutes les permissions
    IF EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND role = 'super_admin') THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier les permissions spécifiques
    RETURN EXISTS (
        SELECT 1 FROM public.admin_permissions ap
        JOIN public.users u ON ap.admin_id = u.id
        WHERE ap.admin_id = user_id 
        AND ap.permission = permission_name
        AND u.role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour créer un utilisateur administrateur
CREATE OR REPLACE FUNCTION public.create_admin_user(
    user_email VARCHAR,
    user_role VARCHAR DEFAULT 'admin',
    permissions VARCHAR[] DEFAULT ARRAY[]::VARCHAR[]
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    perm VARCHAR;
BEGIN
    -- Vérifier que seul un super_admin peut créer des admins
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Accès refusé: seuls les administrateurs peuvent créer des comptes admin';
    END IF;
    
    -- Mettre à jour le rôle de l'utilisateur existant
    UPDATE public.users 
    SET role = user_role 
    WHERE email = user_email 
    RETURNING id INTO new_user_id;
    
    IF new_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé', user_email;
    END IF;
    
    -- Ajouter les permissions
    FOREACH perm IN ARRAY permissions
    LOOP
        INSERT INTO public.admin_permissions (admin_id, permission, granted_by)
        VALUES (new_user_id, perm, auth.uid())
        ON CONFLICT (admin_id, permission) DO NOTHING;
    END LOOP;
    
    -- Log de l'action
    INSERT INTO public.admin_audit_log (admin_id, action, target_table, target_id, new_values)
    VALUES (auth.uid(), 'CREATE_ADMIN', 'users', new_user_id, jsonb_build_object('role', user_role, 'permissions', permissions));
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Politiques RLS pour les tables d'administration
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Politique pour admin_permissions : seuls les admins peuvent voir et gérer
CREATE POLICY "Admins can manage permissions" ON public.admin_permissions
    FOR ALL USING (public.is_admin(auth.uid()));

-- Politique pour admin_audit_log : seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Politique pour permettre aux admins de voir tous les utilisateurs
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Politique pour permettre aux admins de modifier les utilisateurs
CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Politique pour permettre aux admins de voir tous les services
CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL USING (public.is_admin(auth.uid()));

-- Politique pour permettre aux admins de voir toutes les souscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Politique pour permettre aux admins de voir tous les contacts
CREATE POLICY "Admins can manage contacts" ON public.contacts
    FOR ALL USING (public.is_admin(auth.uid()));

-- 9. Créer le premier super administrateur (à exécuter manuellement)
-- Email configuré: mdansoko@hotmail.com
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'mdansoko@hotmail.com',
    crypt('Salim09@Ibrahim16', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

-- Puis créer le profil utilisateur admin
INSERT INTO public.users (id, email, first_name, last_name, account_type, role)
SELECT id, email, 'Mamadou', 'Dansoko', 'professional', 'super_admin'
FROM auth.users WHERE email = 'mdansoko@hotmail.com';
*/

-- 10. Permissions prédéfinies disponibles
/*
Permissions disponibles :
- 'manage_users' : Gérer les utilisateurs
- 'manage_services' : Gérer les services
- 'manage_subscriptions' : Gérer les abonnements
- 'view_analytics' : Voir les analytics
- 'manage_settings' : Gérer les paramètres système
- 'manage_admins' : Gérer les autres administrateurs
- 'view_audit_logs' : Voir les logs d'audit
*/

-- Script terminé avec succès !
-- La gestion des utilisateurs administrateurs est maintenant configurée.