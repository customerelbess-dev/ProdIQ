-- Product analyses saved from the dashboard wizard.
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  product_name text not null,
  product_image text,
  input_type text,
  score integer,
  verdict text,
  market_data jsonb,
  angles jsonb,
  competitors jsonb,
  full_report jsonb,
  status text default 'complete',
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_id_created_at_idx on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

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
