-- ─── 1. Add analysis_count column ───────────────────────────────────────────
alter table public.profiles
  add column if not exists analysis_count integer not null default 0;

-- ─── 2. Auto-create a profile row when a user signs up ───────────────────────
-- This ensures every new user starts on the free plan with analysis_count = 0.
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

-- Drop old trigger if it exists then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 3. Atomic increment RPC ─────────────────────────────────────────────────
-- Returns the NEW analysis_count after incrementing.
-- security definer so it runs with elevated rights regardless of caller.
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

-- ─── 4. Ensure RLS allows users to read their own profile ────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── 5. Back-fill existing users who don't have a profile row yet ────────────
insert into public.profiles (id, plan, analysis_count)
select id, 'free', 0
from   auth.users
on conflict (id) do nothing;
