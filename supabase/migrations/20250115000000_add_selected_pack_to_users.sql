-- Ajouter la colonne selected_pack à la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS selected_pack VARCHAR(50) DEFAULT 'free';

-- Mettre à jour la colonne pour les utilisateurs existants
UPDATE public.users 
SET selected_pack = 'free' 
WHERE selected_pack IS NULL;