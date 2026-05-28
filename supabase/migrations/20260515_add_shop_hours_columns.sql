-- Ajout des horaires d'ouverture/fermeture et du fuseau horaire sur la table shops
-- Format attendu pour open_time/close_time: HH:MM (ex: 08:30)

ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS open_time TEXT;

ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS close_time TEXT;

ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS timezone TEXT;

COMMENT ON COLUMN public.shops.open_time IS 'Heure d’ouverture (HH:MM) dans le fuseau timezone';
COMMENT ON COLUMN public.shops.close_time IS 'Heure de fermeture (HH:MM) dans le fuseau timezone';
COMMENT ON COLUMN public.shops.timezone IS 'Fuseau horaire IANA (ex: Africa/Douala)';
