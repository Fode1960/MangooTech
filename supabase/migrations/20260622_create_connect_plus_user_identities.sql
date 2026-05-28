create table if not exists public.connect_plus_user_identities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_email text not null,
  pin text not null,
  is_active boolean not null default true
);

create unique index if not exists connect_plus_user_identities_email_active_uq
  on public.connect_plus_user_identities (lower(user_email))
  where is_active = true;

create unique index if not exists connect_plus_user_identities_pin_active_uq
  on public.connect_plus_user_identities (pin)
  where is_active = true;

alter table public.connect_plus_user_identities enable row level security;

