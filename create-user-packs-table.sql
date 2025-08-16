-- Script pour créer la table user_packs manquante
-- Cette table est nécessaire pour le fonctionnement du Dashboard

-- Créer la table user_packs si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_packs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pack_id)
);

-- Créer la table user_services si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_id)
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_packs_user_id ON user_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packs_status ON user_packs(status);
CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_status ON user_services(status);

-- Activer RLS (Row Level Security)
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour user_packs : les utilisateurs ne peuvent voir que leurs propres packs
CREATE POLICY IF NOT EXISTS "Users can view own packs" ON user_packs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own packs" ON user_packs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own packs" ON user_packs
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique RLS pour user_services : les utilisateurs ne peuvent voir que leurs propres services
CREATE POLICY IF NOT EXISTS "Users can view own services" ON user_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own services" ON user_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own services" ON user_services
    FOR UPDATE USING (auth.uid() = user_id);

SELECT '✅ Tables user_packs et user_services créées avec succès!' as message;