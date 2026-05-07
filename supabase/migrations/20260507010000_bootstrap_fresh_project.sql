-- ─────────────────────────────────────────────────────────────────────────────
-- ProdIQ — FRESH PROJECT BOOTSTRAP
--
-- Run this ONCE on a brand-new Supabase project. Idempotent — safe to re-run.
-- Open: Supabase Dashboard → SQL Editor → New query → paste this whole file → Run
--
-- Creates:
--   • public.profiles  (one row per auth.users user, plan/limit tracking)
--   • public.analyses  (saved product analyses)
--   • handle_new_user trigger (auto-creates profile row on signup)
--   • increment_analysis_count() RPC
--   • RLS policies for both tables
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. PROFILES table
create table if not exists public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  email                  text,
  full_name              text,
  plan                   text    not null default 'free',
  analysis_count         integer not null default 0,
  analysis_limit         integer,                       -- NULL = unlimited
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_price_id        text,
  created_at             timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email                  text,
  add column if not exists full_name              text,
  add column if not exists plan                   text    not null default 'free',
  add column if not exists analysis_count         integer not null default 0,
  add column if not exists analysis_limit         integer,
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id        text,
  add column if not exists created_at             timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'starter', 'pro', 'agency', 'enterprise'));

create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_plan_idx on public.profiles (id, plan);

-- 2. ANALYSES table — saved analyses from the dashboard wizard
create table if not exists public.analyses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete cascade,
  product_name  text not null,
  product_image text,
  input_type    text,
  score         integer,
  verdict       text,
  market_data   jsonb,
  angles        jsonb,
  competitors   jsonb,
  full_report   jsonb,
  status        text default 'complete',
  created_at    timestamptz not null default now()
);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

-- 3. handle_new_user — copies email + full_name from auth.users on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, plan, analysis_count, analysis_limit)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    'free',
    0,
    1
  )
  on conflict (id) do update
    set email     = coalesce(public.profiles.email,     excluded.email),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Back-fill any auth.users that don't have a profile row yet
insert into public.profiles (id, email, full_name, plan, analysis_count, analysis_limit)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  'free',
  0,
  1
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- 5. increment_analysis_count RPC (used by /api/analyze on success)
create or replace function public.increment_analysis_count(uid uuid)
returns integer
language sql
security definer
as $$
  update public.profiles
  set    analysis_count = analysis_count + 1
  where  id = uid
  returning analysis_count;
$$;

-- 6. RLS — profiles: users read/write their own row; service role bypasses RLS automatically
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 7. RLS — analyses: users only see/modify their own analyses
alter table public.analyses enable row level security;

drop policy if exists "Users insert own analyses" on public.analyses;
drop policy if exists "Users select own analyses" on public.analyses;
drop policy if exists "Users update own analyses" on public.analyses;
drop policy if exists "Users delete own analyses" on public.analyses;

create policy "Users insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users select own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users update own analyses"
  on public.analyses for update
  using (auth.uid() = user_id);

create policy "Users delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

-- 8. Verification query — should show profiles_count == auth_users_count and missing == 0
select
  (select count(*) from auth.users)        as auth_users_count,
  (select count(*) from public.profiles)   as profiles_count,
  (select count(*) from public.analyses)   as analyses_count;
