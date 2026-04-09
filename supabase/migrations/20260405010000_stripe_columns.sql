-- Add Stripe billing fields to profiles table
-- Run in Supabase SQL editor or via `supabase db push`.

alter table public.profiles
  add column if not exists stripe_customer_id    text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id        text;

-- Create unique index so we can look users up by Stripe customer ID
create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Expand plan constraint to include enterprise
alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'starter', 'pro', 'enterprise', 'agency'));
