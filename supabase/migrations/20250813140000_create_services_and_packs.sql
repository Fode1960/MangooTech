-- Migration pour créer le système de gestion des services et packs

-- Table des services disponibles
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  service_type VARCHAR(100) NOT NULL, -- 'website', 'ecommerce', 'marketplace', 'showroom', 'crm', etc.
  base_url VARCHAR(500),
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des packs
CREATE TABLE IF NOT EXISTS packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'FCFA',
  billing_period VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly', 'one-time'
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de mapping entre packs et services
CREATE TABLE IF NOT EXISTS pack_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pack_id, service_id)
);

-- Table pour assigner des packs aux utilisateurs
CREATE TABLE IF NOT EXISTS user_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour tracker les services utilisateur avec statistiques
CREATE TABLE IF NOT EXISTS user_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'setup_required'
  service_url VARCHAR(500),
  visits_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  revenue_amount DECIMAL(10,2) DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

-- Insertion des services de base
INSERT INTO services (name, description, service_type, icon) VALUES
('Mini-site', 'Site web personnel vitrine', 'website', 'Globe'),
('Mini-boutique', 'Boutique en ligne simplifiée', 'ecommerce', 'ShoppingBag'),
('Espace personnel', 'Interface de gestion du profil', 'profile', 'User'),
('Fiche visible', 'Profil public visible', 'profile', 'Eye'),
('Mangoo Connect+', 'Accès à la plateforme de networking', 'networking', 'Users'),
('Référencement Mangoo Market', 'Présence sur la marketplace', 'marketplace', 'Store'),
('Showroom360 simplifié', 'Présentation virtuelle basique', 'showroom', 'Camera'),
('Mangoo Express', 'Service de livraison rapide', 'delivery', 'Truck'),
('Référencement pro', 'SEO et visibilité avancée', 'seo', 'TrendingUp'),
('CRM/ERP simplifié', 'Gestion client et ressources', 'crm', 'Database'),
('Showroom360 complet', 'Présentation virtuelle avancée', 'showroom', 'VrHeadset'),
('Support personnalisé', 'Assistance dédiée', 'support', 'Headphones')
ON CONFLICT (name) DO NOTHING;

-- Insertion des packs de base
INSERT INTO packs (name, description, price, is_popular, sort_order) VALUES
('Pack Découverte', 'Nouveaux artisans', 0, false, 1),
('Pack Visibilité', 'Artisans en phase de croissance', 5000, true, 2),
('Pack Professionnel', 'Artisans organisés, organisations, PME', 10000, false, 3),
('Pack Premium', 'PME structurées et entrepreneurs avancés', 15000, false, 4)
ON CONFLICT (name) DO NOTHING;

-- Configuration des services par pack
-- Pack Découverte (gratuit)
INSERT INTO pack_services (pack_id, service_id)
SELECT p.id, s.id
FROM packs p, services s
WHERE p.name = 'Pack Découverte'
AND s.name IN ('Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+')
ON CONFLICT (pack_id, service_id) DO NOTHING;

-- Pack Visibilité
INSERT INTO pack_services (pack_id, service_id)
SELECT p.id, s.id
FROM packs p, services s
WHERE p.name = 'Pack Visibilité'
AND s.name IN ('Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Référencement Mangoo Market', 'Showroom360 simplifié')
ON CONFLICT (pack_id, service_id) DO NOTHING;

-- Pack Professionnel
INSERT INTO pack_services (pack_id, service_id)
SELECT p.id, s.id
FROM packs p, services s
WHERE p.name = 'Pack Professionnel'
AND s.name IN ('Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Référencement Mangoo Market', 'Showroom360 simplifié', 'Mangoo Express', 'Référencement pro')
ON CONFLICT (pack_id, service_id) DO NOTHING;

-- Pack Premium
INSERT INTO pack_services (pack_id, service_id)
SELECT p.id, s.id
FROM packs p, services s
WHERE p.name = 'Pack Premium'
ON CONFLICT (pack_id, service_id) DO NOTHING;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_pack_services_pack_id ON pack_services(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_services_service_id ON pack_services(service_id);
CREATE INDEX IF NOT EXISTS idx_user_packs_user_id ON user_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packs_status ON user_packs(status);
CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_status ON user_services(status);

-- RLS (Row Level Security) policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;

-- Policies pour les services (lecture publique, écriture admin)
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Services are editable by admins" ON services FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour les packs (lecture publique, écriture admin)
CREATE POLICY "Packs are viewable by everyone" ON packs FOR SELECT USING (true);
CREATE POLICY "Packs are editable by admins" ON packs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour pack_services (lecture publique, écriture admin)
CREATE POLICY "Pack services are viewable by everyone" ON pack_services FOR SELECT USING (true);
CREATE POLICY "Pack services are editable by admins" ON pack_services FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour user_packs (utilisateurs voient leurs propres packs)
CREATE POLICY "Users can view their own packs" ON user_packs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all user packs" ON user_packs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour user_services (utilisateurs voient leurs propres services)
CREATE POLICY "Users can view their own services" ON user_services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own service stats" ON user_services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all user services" ON user_services FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Fonctions utilitaires
CREATE OR REPLACE FUNCTION get_user_services(user_uuid UUID)
RETURNS TABLE (
  service_id UUID,
  service_name VARCHAR,
  service_type VARCHAR,
  service_icon VARCHAR,
  status VARCHAR,
  service_url VARCHAR,
  visits_count INTEGER,
  sales_count INTEGER,
  revenue_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.service_type,
    s.icon,
    us.status,
    us.service_url,
    us.visits_count,
    us.sales_count,
    us.revenue_amount
  FROM user_services us
  JOIN services s ON us.service_id = s.id
  WHERE us.user_id = user_uuid
  AND us.status = 'active'
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_pack_services(pack_uuid UUID)
RETURNS TABLE (
  service_id UUID,
  service_name VARCHAR,
  service_type VARCHAR,
  service_icon VARCHAR,
  service_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.service_type,
    s.icon,
    s.description
  FROM pack_services ps
  JOIN services s ON ps.service_id = s.id
  WHERE ps.pack_id = pack_uuid
  AND ps.is_included = true
  AND s.is_active = true
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;