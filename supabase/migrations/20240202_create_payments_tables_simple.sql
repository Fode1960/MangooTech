-- Table des paiements
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount integer not null, -- en centimes
  currency varchar(3) not null default 'XOF',
  payment_method varchar(50) not null,
  status varchar(20) not null default 'pending',
  stripe_payment_intent_id varchar(255) unique,
  stripe_charge_id varchar(255) unique,
  paypal_order_id varchar(255) unique,
  phone_number varchar(20),
  payer_email varchar(255),
  payer_name varchar(255),
  processing_fee integer default 0,
  net_amount integer not null,
  refund_amount integer default 0,
  failure_reason text,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des transactions
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  payment_id uuid references public.payments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  amount integer not null,
  currency varchar(3) not null,
  type varchar(20) not null, -- success, failed, refunded, disputed
  status varchar(20) not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index pour améliorer les performances
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_stripe_payment_intent_id on public.payments(stripe_payment_intent_id);
create index if not exists idx_payments_paypal_order_id on public.payments(paypal_order_id);
create index if not exists idx_transactions_payment_id on public.transactions(payment_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);

-- RLS (Row Level Security) - Activer RLS
alter table public.payments enable row level security;
alter table public.transactions enable row level security;