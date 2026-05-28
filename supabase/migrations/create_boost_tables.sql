create table if not exists public.boost_products (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('sponsored', 'promo', 'new')),
  duration_hours int not null check (duration_hours in (12, 24, 72)),
  price_xof int not null check (price_xof >= 0),
  currency text not null default 'XOF',
  title text not null,
  description text not null,
  sponsored_tier text null check (sponsored_tier in ('bronze', 'argent', 'or')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, duration_hours)
);

insert into public.boost_products (kind, duration_hours, price_xof, currency, title, description, sponsored_tier)
values
  ('sponsored', 12, 2000, 'XOF', 'Boost Sponsorisé (12h)', 'Sponsorisé sur la carte Mangoo Local+ (12h)', 'bronze'),
  ('sponsored', 24, 5000, 'XOF', 'Boost Sponsorisé (24h)', 'Sponsorisé sur la carte Mangoo Local+ (24h)', 'argent'),
  ('sponsored', 72, 12000, 'XOF', 'Boost Sponsorisé (72h)', 'Sponsorisé sur la carte Mangoo Local+ (72h)', 'or'),
  ('promo', 24, 1000, 'XOF', 'Boost Promo (24h)', 'Badge Promo sur la carte Mangoo Local+ (24h)', null),
  ('promo', 72, 2500, 'XOF', 'Boost Promo (72h)', 'Badge Promo sur la carte Mangoo Local+ (72h)', null),
  ('new', 24, 500, 'XOF', 'Boost Nouveau (24h)', 'Badge Nouveau sur la carte Mangoo Local+ (24h)', null),
  ('new', 72, 1500, 'XOF', 'Boost Nouveau (72h)', 'Badge Nouveau sur la carte Mangoo Local+ (72h)', null)
on conflict (kind, duration_hours) do update
set
  price_xof = excluded.price_xof,
  currency = excluded.currency,
  title = excluded.title,
  description = excluded.description,
  sponsored_tier = excluded.sponsored_tier,
  active = true,
  updated_at = now();

create table if not exists public.vendor_boosts (
  vendor_id text not null,
  vendor_kind text not null,
  sponsored_until timestamptz null,
  sponsored_tier text null check (sponsored_tier in ('bronze', 'argent', 'or')),
  promo_until timestamptz null,
  new_until timestamptz null,
  updated_at timestamptz not null default now(),
  primary key (vendor_id, vendor_kind)
);

alter table public.vendor_boosts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vendor_boosts'
      and policyname = 'Public read vendor boosts'
  ) then
    create policy "Public read vendor boosts"
      on public.vendor_boosts
      for select
      using (true);
  end if;
end $$;

create table if not exists public.boost_orders (
  id uuid primary key,
  user_id uuid not null,
  vendor_id text not null,
  vendor_kind text not null,
  boost_kind text not null check (boost_kind in ('sponsored', 'promo', 'new')),
  duration_hours int not null check (duration_hours in (12, 24, 72)),
  amount_xof int not null,
  currency text not null default 'XOF',
  status text not null check (status in ('pending', 'paid', 'active', 'cancelled', 'failed', 'expired')),
  sponsored_tier text null check (sponsored_tier in ('bronze', 'argent', 'or')),
  stripe_session_id text null,
  paid_at timestamptz null,
  activated_at timestamptz null,
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boost_orders_user_id_idx on public.boost_orders (user_id);
create index if not exists boost_orders_vendor_idx on public.boost_orders (vendor_id, vendor_kind);
create index if not exists boost_orders_status_idx on public.boost_orders (status);

alter table public.boost_orders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'boost_orders'
      and policyname = 'Users read own boost orders'
  ) then
    create policy "Users read own boost orders"
      on public.boost_orders
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

