-- Migration pour ajouter les champs de consentement à la géolocalisation
-- Ajout des champs pour stocker les données de géolocalisation et le consentement

-- Ajouter les colonnes pour la géolocalisation
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS geolocation_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMP WITH TIME ZONE;

-- Créer une table séparée pour l'historique des consentements
CREATE TABLE IF NOT EXISTS public.user_geolocation_consent_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    consent_given BOOLEAN NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_accuracy DECIMAL(10, 2),
    consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mettre à jour la fonction handle_new_user pour inclure les données de géolocalisation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        first_name, 
        last_name, 
        phone, 
        company, 
        account_type,
        geolocation_consent,
        consent_timestamp,
        latitude,
        longitude,
        location_accuracy,
        location_timestamp
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
        COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'company', ''),
        COALESCE(NEW.raw_user_meta_data->>'accountType', 'individual'),
        COALESCE((NEW.raw_user_meta_data->>'geolocation_consent')::BOOLEAN, FALSE),
        CASE 
            WHEN (NEW.raw_user_meta_data->>'geolocation_consent')::BOOLEAN = TRUE 
            THEN NOW() 
            ELSE NULL 
        END,
        COALESCE((NEW.raw_user_meta_data->>'latitude')::DECIMAL, NULL),
        COALESCE((NEW.raw_user_meta_data->>'longitude')::DECIMAL, NULL),
        COALESCE((NEW.raw_user_meta_data->>'location_accuracy')::DECIMAL, NULL),
        CASE 
            WHEN NEW.raw_user_meta_data->>'location_timestamp' IS NOT NULL 
            THEN (NEW.raw_user_meta_data->>'location_timestamp')::TIMESTAMP WITH TIME ZONE 
            ELSE NULL 
        END
    );
    
    -- Enregistrer dans l'historique si le consentement est donné
    IF (NEW.raw_user_meta_data->>'geolocation_consent')::BOOLEAN = TRUE THEN
        INSERT INTO public.user_geolocation_consent_history (
            user_id,
            consent_given,
            latitude,
            longitude,
            location_accuracy,
            consent_timestamp
        )
        VALUES (
            NEW.id,
            TRUE,
            COALESCE((NEW.raw_user_meta_data->>'latitude')::DECIMAL, NULL),
            COALESCE((NEW.raw_user_meta_data->>'longitude')::DECIMAL, NULL),
            COALESCE((NEW.raw_user_meta_data->>'location_accuracy')::DECIMAL, NULL),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_geolocation_consent ON public.users(geolocation_consent);
CREATE INDEX IF NOT EXISTS idx_user_geolocation_consent_history_user_id ON public.user_geolocation_consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_geolocation_consent_history_timestamp ON public.user_geolocation_consent_history(consent_timestamp);

-- Politiques RLS pour la table d'historique des consentements
ALTER TABLE public.user_geolocation_consent_history ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leur propre historique de consentement
DROP POLICY IF EXISTS "Users can view own consent history" ON public.user_geolocation_consent_history;
CREATE POLICY "Users can view own consent history" ON public.user_geolocation_consent_history
    FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des entrées dans leur historique (via la fonction trigger)
DROP POLICY IF EXISTS "Users can create consent history" ON public.user_geolocation_consent_history;
CREATE POLICY "Users can create consent history" ON public.user_geolocation_consent_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vue pour faciliter la consultation des utilisateurs avec leur consentement
CREATE OR REPLACE VIEW public.user_profiles_with_geolocation AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    company,
    account_type,
    geolocation_consent,
    consent_timestamp,
    latitude,
    longitude,
    location_accuracy,
    location_timestamp,
    created_at,
    updated_at
FROM public.users
WHERE geolocation_consent = TRUE;

-- Commentaires pour documentation
COMMENT ON COLUMN public.users.geolocation_consent IS 'Indique si l\utilisateur a consenti à la collecte de sa géolocalisation';
COMMENT ON COLUMN public.users.consent_timestamp IS 'Date et heure du consentement à la géolocalisation';
COMMENT ON COLUMN public.users.latitude IS 'Latitude de la dernière position connue';
COMMENT ON COLUMN public.users.longitude IS 'Longitude de la dernière position connue';
COMMENT ON COLUMN public.users.location_accuracy IS 'Précision de la localisation en mètres';
COMMENT ON COLUMN public.users.location_timestamp IS 'Date et heure de la dernière position connue';

COMMENT ON TABLE public.user_geolocation_consent_history IS 'Historique des consentements à la géolocalisation des utilisateurs';