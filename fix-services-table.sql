-- Script pour corriger la structure de la table services
-- Ajouter la colonne service_type si elle n'existe pas

-- Vérifier et ajouter la colonne service_type
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);

-- Vérifier et ajouter la colonne base_url
ALTER TABLE services ADD COLUMN IF NOT EXISTS base_url VARCHAR(500);

-- Vérifier et ajouter la colonne icon
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon VARCHAR(100);

-- Vérifier et ajouter la colonne is_active
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Mettre à jour les services existants avec des valeurs par défaut
UPDATE services SET 
  service_type = 'general',
  is_active = true
WHERE service_type IS NULL;

-- Insérer les nouveaux services seulement s'ils n'existent pas déjà
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

SELECT '✅ Structure de la table services corrigée!' as message;