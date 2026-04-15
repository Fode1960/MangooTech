-- Public vendor boosts table for cross-device boost discovery (demo)

create table if not exists public.vendor_boosts (
  vendor_id text not null,
  vendor_kind text not null default 'shop',
  sponsored_until timestamptz,
  sponsored_tier text,
  promo_until timestamptz,
  new_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (vendor_kind, vendor_id)
);

alter table public.vendor_boosts enable row level security;

drop policy if exists vendor_boosts_public_select on public.vendor_boosts;
create policy vendor_boosts_public_select
on public.vendor_boosts
for select
using (true);

drop policy if exists vendor_boosts_public_insert on public.vendor_boosts;
create policy vendor_boosts_public_insert
on public.vendor_boosts
for insert
with check (true);

drop policy if exists vendor_boosts_public_update on public.vendor_boosts;
create policy vendor_boosts_public_update
on public.vendor_boosts
for update
using (true)
with check (true);

