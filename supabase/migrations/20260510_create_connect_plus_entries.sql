CREATE TABLE IF NOT EXISTS public.connect_plus_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug TEXT NOT NULL,
  pin TEXT NOT NULL,
  token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connect_plus_entries_pin_unique ON public.connect_plus_entries(pin) WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_connect_plus_entries_token_unique ON public.connect_plus_entries(token) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_connect_plus_entries_shop_slug ON public.connect_plus_entries(shop_slug);
CREATE INDEX IF NOT EXISTS idx_connect_plus_entries_created_at ON public.connect_plus_entries(created_at DESC);

ALTER TABLE public.connect_plus_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS connect_plus_entries_public_read ON public.connect_plus_entries;
CREATE POLICY connect_plus_entries_public_read ON public.connect_plus_entries
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

GRANT SELECT ON public.connect_plus_entries TO anon;
GRANT ALL ON public.connect_plus_entries TO authenticated;

