-- Migration pour ajouter la colonne category dans la table shops
-- Cette colonne stockera le nom de la catégorie principale de la boutique

ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.shops.category IS 'Catégorie principale de la boutique (ex: Mode, Électronique, Artisanat, etc.)';

-- Créer un index pour améliorer les performances de recherche par catégorie
CREATE INDEX IF NOT EXISTS idx_shops_category ON public.shops(category);

-- Optionnel : Mettre à jour les boutiques existantes avec une catégorie par défaut
UPDATE public.shops 
SET category = 'Général' 
WHERE category IS NULL;