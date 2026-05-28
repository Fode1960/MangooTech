create table if not exists public.route_cache (
  key text primary key,
  response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists route_cache_expires_at_idx on public.route_cache (expires_at);

