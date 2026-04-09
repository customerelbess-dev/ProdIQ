-- ─────────────────────────────────────────────────────────────────────────────
-- Safe to run multiple times (all statements are idempotent).
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add analysis_count column if it doesn't already exist
alter table public.profiles
  add column if not exists analysis_count integer not null default 0;

-- 2. Make sure the stripe columns exist too (safe no-ops if already present)
alter table public.profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id        text;

-- 3. Ensure plan column exists and accepts all valid values
alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'starter', 'pro', 'agency', 'enterprise'));

-- 4. Back-fill any existing auth users who have no profiles row yet
--    (safe no-op if rows already exist)
insert into public.profiles (id, plan, analysis_count)
select id, 'free', 0
from   auth.users
on conflict (id) do nothing;

-- 5. Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, plan, analysis_count)
  values (new.id, 'free', 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. RLS: users can read/update their own row; service role bypasses all RLS
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

-- 7. Fix the specific user who paid but still shows free
--    (safe to run — only updates if they exist)
update public.profiles
set    plan           = 'starter',
       analysis_count = 0
where  id = 'a21cd9b4-4b40-4903-89b0-4874570b19f6'
  and  plan = 'free';  -- only update if still stuck on free

-- 8. Verify the result
select id, plan, analysis_count, stripe_customer_id
from   public.profiles
where  id = 'a21cd9b4-4b40-4903-89b0-4874570b19f6';
