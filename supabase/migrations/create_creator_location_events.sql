CREATE TABLE IF NOT EXISTS public.creator_location_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('shop', 'provider')),
  source TEXT NOT NULL DEFAULT 'localplus',
  vendor_id TEXT NOT NULL,
  owner_email TEXT,
  owner_name TEXT,
  name TEXT,
  category TEXT,
  trade TEXT,
  lat DOUBLE PRECISION NOT NULL CHECK (lat >= -90 AND lat <= 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng >= -180 AND lng <= 180),
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_location_events_created_at ON public.creator_location_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_location_events_kind ON public.creator_location_events(kind);
CREATE INDEX IF NOT EXISTS idx_creator_location_events_vendor_id ON public.creator_location_events(vendor_id);

ALTER TABLE public.creator_location_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_location_events_insert ON public.creator_location_events;
CREATE POLICY creator_location_events_insert ON public.creator_location_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (source = 'localplus');

DROP POLICY IF EXISTS creator_location_events_admin_read ON public.creator_location_events;
CREATE POLICY creator_location_events_admin_read ON public.creator_location_events
  FOR SELECT
  TO authenticated
  USING (is_user_admin(auth.uid()));

GRANT INSERT ON public.creator_location_events TO anon, authenticated;
GRANT SELECT ON public.creator_location_events TO authenticated;
