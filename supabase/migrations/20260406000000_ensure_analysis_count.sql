-- ─────────────────────────────────────────────────────────────────────────────
-- Safe to run multiple times (all statements are idempotent).
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Core columns (safe no-ops if already present)
alter table public.profiles
  add column if not exists plan                  text    not null default 'free',
  add column if not exists analysis_count        integer not null default 0,
  add column if not exists analysis_limit        integer,          -- NULL = unlimited
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id        text;

-- 2. Plan constraint (drop first so we can re-add safely)
alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'starter', 'pro', 'agency', 'enterprise'));

-- 3. Populate analysis_limit for all existing rows based on their current plan
--    free=1, starter=15, pro=30, agency/enterprise=NULL (unlimited)
update public.profiles
set analysis_limit = case
  when plan = 'free'                       then 1
  when plan = 'starter'                    then 15
  when plan = 'pro'                        then 30
  when plan in ('agency', 'enterprise')    then null
  else 1  -- unknown plan defaults to free limit
end
where analysis_limit is null
  -- also re-sync rows where analysis_limit is wrong (e.g. plan changed via webhook)
   or (plan = 'free'    and analysis_limit != 1)
   or (plan = 'starter' and analysis_limit != 15)
   or (plan = 'pro'     and analysis_limit != 30);

-- 4. Back-fill any auth users who have no profile row yet
insert into public.profiles (id, plan, analysis_count, analysis_limit)
select id, 'free', 0, 1
from   auth.users
on conflict (id) do nothing;

-- 5. Auto-create a profile row (with correct analysis_limit) on new signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, plan, analysis_count, analysis_limit)
  values (new.id, 'free', 0, 1)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Atomic increment RPC (used by the API route after a successful analysis)
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

-- 7. RLS: users can read/update their own row; service role bypasses all RLS
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

-- 8. Fix the specific user who paid but still shows free
update public.profiles
set    plan           = 'starter',
       analysis_count = 0,
       analysis_limit = 15
where  id = 'a21cd9b4-4b40-4903-89b0-4874570b19f6'
  and  plan = 'free';

-- 9. Verify
select id, plan, analysis_count, analysis_limit, stripe_customer_id
from   public.profiles
where  id = 'a21cd9b4-4b40-4903-89b0-4874570b19f6';
