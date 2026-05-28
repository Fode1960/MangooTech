-- Migration simplifiée pour le système d'administration
-- Création des tables de base et extension de shops

-- Table des rôles utilisateurs
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories de boutiques
CREATE TABLE IF NOT EXISTS shop_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100),
    name_en VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    parent_id UUID REFERENCES shop_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des règles de commission
CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2),
    category_id UUID REFERENCES shop_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extension simplifiée de la table shops existante
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES shop_categories(id),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'XOF',
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Ouagadougou',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_rule_id UUID REFERENCES commission_rules(id),
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS total_sales DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Table des utilisateurs admin
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role_id UUID NOT NULL REFERENCES user_roles(id),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des analytics par boutique
CREATE TABLE IF NOT EXISTS shop_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id),
    date DATE NOT NULL,
    
    -- Métriques de vente
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_items_sold INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Métriques de performance
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    session_duration INTEGER DEFAULT 0, -- en secondes
    
    -- Métriques de paiement
    successful_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    payment_success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Répartition par méthode de paiement
    mobile_money_payments INTEGER DEFAULT 0,
    card_payments INTEGER DEFAULT 0,
    cash_payments INTEGER DEFAULT 0,
    
    -- Répartition par opérateur mobile
    orange_money_payments INTEGER DEFAULT 0,
    mtn_money_payments INTEGER DEFAULT 0,
    moov_money_payments INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, date)
);

-- Table des logs d'activité admin
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paramètres système
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shops_category_id ON shops(category_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_verified ON shops(is_verified);
CREATE INDEX IF NOT EXISTS idx_shops_commission_rule_id ON shops(commission_rule_id);

CREATE INDEX IF NOT EXISTS idx_shop_analytics_shop_id ON shop_analytics(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_analytics_date ON shop_analytics(date);
CREATE INDEX IF NOT EXISTS idx_shop_analytics_shop_date ON shop_analytics(shop_id, date);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource ON admin_activity_logs(resource_type, resource_id);

-- Insertion des rôles par défaut
INSERT INTO user_roles (name, description, permissions) VALUES
('super_admin', 'Super Administrateur - Accès complet', '{
  "shops": ["create", "read", "update", "delete", "approve", "suspend"],
  "users": ["create", "read", "update", "delete", "manage_roles"],
  "analytics": ["read", "export"],
  "commissions": ["create", "read", "update", "delete"],
  "settings": ["create", "read", "update", "delete"],
  "payments": ["read", "refund", "manage"]
}'),
('admin', 'Administrateur - Gestion quotidienne', '{
  "shops": ["read", "update", "approve", "suspend"],
  "users": ["read", "update"],
  "analytics": ["read", "export"],
  "commissions": ["read", "update"],
  "settings": ["read", "update"],
  "payments": ["read", "refund"]
}'),
('moderator', 'Modérateur - Surveillance et support', '{
  "shops": ["read", "suspend"],
  "users": ["read"],
  "analytics": ["read"],
  "payments": ["read"]
}'),
('finance_manager', 'Responsable Financier - Gestion des commissions', '{
  "shops": ["read"],
  "analytics": ["read", "export"],
  "commissions": ["create", "read", "update"],
  "payments": ["read", "export"]
}'),
('support_agent', 'Agent Support - Aide aux utilisateurs', '{
  "shops": ["read"],
  "users": ["read"],
  "analytics": ["read"]
}');

-- Insertion des catégories de base
INSERT INTO shop_categories (name, name_fr, name_en, description, icon, color) VALUES
('Électronique', 'Électronique', 'Electronics', 'Téléphones, ordinateurs, accessoires', 'smartphone', '#3B82F6'),
('Mode', 'Mode', 'Fashion', 'Vêtements, chaussures, accessoires', 'shirt', '#EF4444'),
('Alimentation', 'Alimentation', 'Food', 'Produits alimentaires, restaurants', 'utensils', '#F59E0B'),
('Beauté', 'Beauté', 'Beauty', 'Produits de beauté, soins', 'sparkles', '#EC4899'),
('Maison', 'Maison', 'Home', 'Meubles, décoration, électroménager', 'home', '#10B981'),
('Sports', 'Sports', 'Sports', 'Équipements sportifs, vêtements', 'dumbbell', '#8B5CF6'),
('Automobile', 'Automobile', 'Automotive', 'Pièces, accessoires auto', 'car', '#6B7280'),
('Services', 'Services', 'Services', 'Services professionnels', 'briefcase', '#6366F1');

-- Insertion des règles de commission par défaut
INSERT INTO commission_rules (name, description, commission_type, commission_value, min_amount, max_amount) VALUES
('Standard', 'Commission standard pour toutes les catégories', 'percentage', 2.5, 0, NULL),
('Électronique', 'Commission pour produits électroniques', 'percentage', 1.5, 0, NULL),
('Mode', 'Commission pour produits de mode', 'percentage', 3.0, 0, NULL),
('Alimentation', 'Commission pour produits alimentaires', 'percentage', 2.0, 0, NULL),
('Petit montant', 'Commission fixe pour petits montants', 'fixed', 50, 0, 1000),
('Grand montant', 'Commission réduite pour grands montants', 'percentage', 1.0, 100000, NULL);

-- Paramètres système par défaut
INSERT INTO system_settings (key, value, type, description, is_public) VALUES
('site_name', 'MangooTech Platform', 'string', 'Nom du site', true),
('site_description', 'Plateforme e-commerce africaine', 'string', 'Description du site', true),
('default_currency', 'XOF', 'string', 'Devise par défaut', true),
('default_language', 'fr', 'string', 'Langue par défaut', true),
('min_withdrawal_amount', '5000', 'number', 'Montant minimum de retrait', false),
('max_daily_withdrawal', '500000', 'number', 'Montant maximum de retrait journalier', false),
('shop_auto_approval', 'false', 'boolean', 'Approbation automatique des boutiques', false),
('commission_calculation_days', '30', 'number', 'Nombre de jours pour le calcul des commissions', false);

-- Permissions pour les tables admin
GRANT SELECT ON user_roles TO anon, authenticated;
GRANT SELECT ON shop_categories TO anon, authenticated;
GRANT SELECT ON commission_rules TO anon, authenticated;
GRANT SELECT ON shops TO anon, authenticated;
GRANT SELECT ON admin_users TO anon, authenticated;
GRANT SELECT ON shop_analytics TO anon, authenticated;
GRANT SELECT ON system_settings TO anon, authenticated;

-- Permissions pour les opérations CRUD (admin uniquement)
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON shop_categories TO authenticated;
GRANT ALL ON commission_rules TO authenticated;
GRANT ALL ON shops TO authenticated;
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON shop_analytics TO authenticated;
GRANT ALL ON admin_activity_logs TO authenticated;
GRANT ALL ON system_settings TO authenticated;