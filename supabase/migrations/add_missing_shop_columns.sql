-- Migration pour ajouter les colonnes manquantes dans la table shops
-- Le formulaire AdminCreateShop attend des champs spécifiques

-- Ajouter la colonne city (ville) si elle n'existe pas
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Ajouter la colonne phone si elle n'existe pas  
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Ajouter la colonne email si elle n'existe pas
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Commentaires pour documentation
COMMENT ON COLUMN public.shops.city IS 'Ville de la boutique';
COMMENT ON COLUMN public.shops.phone IS 'Numéro de téléphone de la boutique';
COMMENT ON COLUMN public.shops.email IS 'Email de contact de la boutique';

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shops_city ON public.shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_phone ON public.shops(phone);
CREATE INDEX IF NOT EXISTS idx_shops_email ON public.shops(email);