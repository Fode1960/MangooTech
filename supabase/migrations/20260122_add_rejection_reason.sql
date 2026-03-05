-- Migration: Ajouter la colonne rejection_reason à la table shops
-- Date: 2026-01-22
-- Description: Ajoute une colonne pour stocker la raison du rejet d'une boutique

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN shops.rejection_reason IS 'Raison du rejet de la boutique (utilisée quand status = rejected)';

-- Index pour améliorer les performances si nécessaire
CREATE INDEX IF NOT EXISTS idx_shops_rejection_reason ON shops(rejection_reason) WHERE rejection_reason IS NOT NULL;