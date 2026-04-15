-- Enable public access to shops for cross-device sync
-- WARNING: This grants anonymous read/write/update on shops

alter table public.shops enable row level security;

drop policy if exists shops_public_select on public.shops;
create policy shops_public_select
on public.shops
for select
using (true);

drop policy if exists shops_public_insert on public.shops;
create policy shops_public_insert
on public.shops
for insert
with check (true);

drop policy if exists shops_public_update on public.shops;
create policy shops_public_update
on public.shops
for update
using (true)
with check (true);

