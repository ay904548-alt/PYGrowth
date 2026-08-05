-- ─────────────────────────────────────────────────────────────────────────────
-- PY Growth — Payment Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── customers ───────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text not null,
  phone        text not null,
  company_name text,
  created_at   timestamptz not null default now(),

  constraint customers_email_check check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Unique index so we can upsert on email
create unique index if not exists customers_email_idx on public.customers (lower(email));

-- ─── orders ──────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                              uuid primary key default gen_random_uuid(),
  customer_id                     uuid not null references public.customers (id) on delete restrict,

  -- JSON array of selected services
  -- Each element: { name, category, quantity, unit_price, final_price }
  selected_services               jsonb not null default '[]'::jsonb,

  subtotal                        numeric(12, 2) not null,
  gst_amount                      numeric(12, 2) not null,
  total_amount                    numeric(12, 2) not null,

  status                          text not null default 'pending_payment'
                                    check (status in (
                                      'pending_payment',
                                      'payment_initiated',
                                      'payment_captured',
                                      'payment_failed',
                                      'refunded'
                                    )),

  -- Payment provider fields (filled after Razorpay is connected)
  payment_provider                text,
  payment_provider_order_id       text,
  payment_provider_payment_id     text,
  payment_provider_signature      text,

  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- Helpful indexes
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_status_idx       on public.orders (status);
create index if not exists orders_created_at_idx   on public.orders (created_at desc);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Both tables are managed exclusively by the service-role key (Edge Functions).
-- Anon / authenticated users have no direct table access.

alter table public.customers enable row level security;
alter table public.orders    enable row level security;

-- No policies = all access blocked for non-service-role callers (RLS default-deny).
-- The Edge Function uses the service-role key and therefore bypasses RLS entirely.
