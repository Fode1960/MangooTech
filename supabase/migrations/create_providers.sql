-- Create providers table with approval workflow

CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    country VARCHAR(2) DEFAULT 'BF',
    services JSONB DEFAULT '[]'::jsonb,
    portfolio JSONB DEFAULT '[]'::jsonb,
    zones JSONB DEFAULT '[]'::jsonb,
    is_mobile BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    is_visible BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_user_unique ON public.providers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_slug ON public.providers(slug);
CREATE INDEX IF NOT EXISTS idx_providers_created_at ON public.providers(created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_providers_updated_at ON public.providers;
CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS providers_public_read ON public.providers;
CREATE POLICY providers_public_read ON public.providers
    FOR SELECT
    TO anon, authenticated
    USING (status = 'approved' AND is_visible = TRUE);

DROP POLICY IF EXISTS providers_owner_read ON public.providers;
CREATE POLICY providers_owner_read ON public.providers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS providers_owner_insert ON public.providers;
CREATE POLICY providers_owner_insert ON public.providers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
        AND is_visible = FALSE
    );

DROP POLICY IF EXISTS providers_owner_update_except_status_visibility ON public.providers;
CREATE POLICY providers_owner_update_except_status_visibility ON public.providers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND status = (SELECT p.status FROM public.providers p WHERE p.id = providers.id)
        AND is_visible = (SELECT p.is_visible FROM public.providers p WHERE p.id = providers.id)
    );

DROP POLICY IF EXISTS providers_admin_all ON public.providers;
CREATE POLICY providers_admin_all ON public.providers
    FOR ALL
    TO authenticated
    USING (is_user_admin(auth.uid()));

GRANT SELECT ON public.providers TO anon;
GRANT ALL ON public.providers TO authenticated;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'user_roles'
    ) THEN
        UPDATE public.user_roles
        SET permissions = jsonb_set(permissions, '{providers}', '["create","read","update","delete","approve","suspend"]'::jsonb, true)
        WHERE name IN ('super_admin', 'admin', 'moderator');

        UPDATE public.user_roles
        SET permissions = jsonb_set(permissions, '{providers}', '["read"]'::jsonb, true)
        WHERE name IN ('support');
    END IF;
END $$;
