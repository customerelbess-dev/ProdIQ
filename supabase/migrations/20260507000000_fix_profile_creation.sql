-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: Profile rows not being created on signup, login fails afterwards.
--
-- This migration is fully idempotent — safe to re-run any number of times.
-- Run it in Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste this entire file → Run
--
-- What it does:
--   1. Ensures `profiles` has every column the app expects (full_name, email,
--      plan, analysis_count, analysis_limit, stripe_*)
--   2. Replaces `handle_new_user()` so it ALSO copies email + full_name from
--      auth.users — the row will now be complete regardless of whether the
--      user has confirmed their email yet
--   3. Re-creates the `on_auth_user_created` trigger
--   4. Back-fills profile rows for ANY existing auth.users that don't have one
--   5. Re-installs RLS policies (users can read/write their own row)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ensure all required columns exist (safe if already there)
alter table public.profiles
  add column if not exists full_name              text,
  add column if not exists email                  text,
  add column if not exists plan                   text    not null default 'free',
  add column if not exists analysis_count         integer not null default 0,
  add column if not exists analysis_limit         integer,                 -- NULL = unlimited
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id        text,
  add column if not exists created_at             timestamptz not null default now();

-- 2. Plan constraint (drop first so re-runs succeed)
alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'starter', 'pro', 'agency', 'enterprise'));

-- 3. The trigger function — copies full_name + email from auth.users at signup time
--    SECURITY DEFINER means it runs with the table owner's rights, bypassing RLS.
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

-- 4. Trigger — fires for every new row in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Back-fill any auth.users that don't have a profile row yet (existing accounts)
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

-- 6. Atomic increment RPC (used by /api/analyze after a successful analysis)
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

-- 7. RLS — users can read + insert + update their own row only
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can select own profile" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 8. Verify (should return one row per existing auth user)
select
  count(*) filter (where p.id is not null) as profiles_count,
  count(*) filter (where p.id is null)     as missing_profiles,
  count(u.id)                              as auth_users_count
from auth.users u
left join public.profiles p on p.id = u.id;
