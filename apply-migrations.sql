-- Script pour appliquer les migrations manuellement dans Supabase
-- Copiez et collez ce contenu dans l'éditeur SQL de Supabase
-- URL: https://supabase.com/dashboard -> Votre projet -> SQL Editor

-- =====================================================
-- CRÉATION DES TABLES MANQUANTES
-- =====================================================

-- Table des packs
CREATE TABLE IF NOT EXISTS packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'FCFA',
  billing_period VARCHAR(20) DEFAULT 'monthly',
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
  status VARCHAR(20) DEFAULT 'active',
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
  status VARCHAR(20) DEFAULT 'active',
  service_url VARCHAR(500),
  visits_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  revenue_amount DECIMAL(10,2) DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

-- =====================================================
-- INSERTION DES DONNÉES DE BASE
-- =====================================================

-- Insertion des packs de base
INSERT INTO packs (name, description, price, is_popular, sort_order) VALUES
('Pack Découverte', 'Nouveaux artisans', 0, false, 1),
('Pack Visibilité', 'Artisans en phase de croissance', 5000, true, 2),
('Pack Professionnel', 'Artisans organisés, organisations, PME', 10000, false, 3),
('Pack Premium', 'PME structurées et entrepreneurs avancés', 15000, false, 4)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CORRECTION DE LA STRUCTURE DE LA TABLE SERVICES
-- =====================================================

-- Ajouter les colonnes manquantes à la table services si elles n'existent pas
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS base_url VARCHAR(500);
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Mettre à jour les services existants avec des valeurs par défaut
UPDATE services SET 
  service_type = 'general',
  is_active = true
WHERE service_type IS NULL;

-- Vérifier si les services existent, sinon les créer
INSERT INTO services (name, description, service_type, icon)
SELECT * FROM (
  VALUES
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
) AS new_services(name, description, service_type, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE services.name = new_services.name
);

-- Configuration des services par pack
-- Pack Découverte (gratuit)
INSERT INTO pack_services (pack_id, service_id)
SELECT p.id, s.id
FROM packs p, services s
WHERE p.name = 'Pack Découverte'
AND s.name IN ('Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+')
AND NOT EXISTS (
  SELECT 1 FROM pack_services ps WHERE ps.pack_id = p.id AND ps.service_id = s.id
);

-- Pack Visibilité
INSERT INTO pack_services (pack_id, service_id)
SELECT p.id, s.id
FROM packs p, services s
WHERE p.name = 'Pack Visibilité'
AND s.name IN ('Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Référencement Mangoo Market', 'Showroom360 simplifié')
AND NOT EXISTS (
  SELECT 1 FROM pack_services ps WHERE ps.pack_id = p.id AND ps.service_id = s.id
);

-- Pack Professionnel
INSERT INTO pack_services (pack_id, service_id)
SELECT p.id, s.id
FROM packs p, services s
WHERE p.name = 'Pack Professionnel'
AND s.name IN ('Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Référencement Mangoo Market', 'Showroom360 simplifié', 'Mangoo Express', 'Référencement pro')
AND NOT EXISTS (
  SELECT 1 FROM pack_services ps WHERE ps.pack_id = p.id AND ps.service_id = s.id
);

-- Pack Premium (tous les services)
INSERT INTO pack_services (pack_id, service_id)
SELECT p.id, s.id
FROM packs p, services s
WHERE p.name = 'Pack Premium'
AND NOT EXISTS (
  SELECT 1 FROM pack_services ps WHERE ps.pack_id = p.id AND ps.service_id = s.id
);

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pack_services_pack_id ON pack_services(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_services_service_id ON pack_services(service_id);
CREATE INDEX IF NOT EXISTS idx_user_packs_user_id ON user_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packs_status ON user_packs(status);
CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_status ON user_services(status);

-- =====================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;

-- Policies pour les services (lecture publique, écriture admin)
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Services are editable by admins" ON services;
CREATE POLICY "Services are editable by admins" ON services FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour les packs (lecture publique, écriture admin)
DROP POLICY IF EXISTS "Packs are viewable by everyone" ON packs;
CREATE POLICY "Packs are viewable by everyone" ON packs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Packs are editable by admins" ON packs;
CREATE POLICY "Packs are editable by admins" ON packs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour pack_services (lecture publique, écriture admin)
DROP POLICY IF EXISTS "Pack services are viewable by everyone" ON pack_services;
CREATE POLICY "Pack services are viewable by everyone" ON pack_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Pack services are editable by admins" ON pack_services;
CREATE POLICY "Pack services are editable by admins" ON pack_services FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour user_packs (utilisateurs voient leurs propres packs)
DROP POLICY IF EXISTS "Users can view their own packs" ON user_packs;
CREATE POLICY "Users can view their own packs" ON user_packs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all user packs" ON user_packs;
CREATE POLICY "Admins can manage all user packs" ON user_packs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour user_services (utilisateurs voient leurs propres services)
DROP POLICY IF EXISTS "Users can view their own services" ON user_services;
CREATE POLICY "Users can view their own services" ON user_services FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own service stats" ON user_services;
CREATE POLICY "Users can update their own service stats" ON user_services FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all user services" ON user_services;
CREATE POLICY "Admins can manage all user services" ON user_services FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour récupérer les services d'un utilisateur
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

-- Fonction pour récupérer les services d'un pack
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

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que tout a été créé correctement
SELECT 'Tables créées:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('services', 'packs', 'pack_services', 'user_packs', 'user_services');

SELECT 'Nombre de services:' as status, COUNT(*) as count FROM services;
SELECT 'Nombre de packs:' as status, COUNT(*) as count FROM packs;
SELECT 'Nombre de relations pack-service:' as status, COUNT(*) as count FROM pack_services;

SELECT '✅ Migrations appliquées avec succès!' as message;