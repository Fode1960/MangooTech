-- Migration pour ajouter la colonne failure_reason à la table payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Mise à jour des permissions pour la nouvelle colonne
GRANT SELECT (failure_reason) ON payments TO anon;
GRANT SELECT (failure_reason) ON payments TO authenticated;
GRANT UPDATE (failure_reason) ON payments TO authenticated;