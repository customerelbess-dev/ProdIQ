-- Add plan tier to profiles table
-- Run in Supabase SQL editor or via `supabase db push`.

alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'starter', 'pro', 'agency'));

-- Index for fast plan lookups
create index if not exists profiles_plan_idx on public.profiles (id, plan);
