-- Atomurus profiles + study data (run in Supabase SQL editor or via CLI migrations)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free',
  trial_ends_at timestamptz,
  locale text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('element', 'molecule', 'calculator', 'article')),
  item_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_key)
);

create index if not exists study_items_user_created_idx on public.study_items (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.study_items enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "study_items_select_own"
  on public.study_items for select
  using (auth.uid() = user_id);

create policy "study_items_insert_own"
  on public.study_items for insert
  with check (auth.uid() = user_id);

create policy "study_items_update_own"
  on public.study_items for update
  using (auth.uid() = user_id);

create policy "study_items_delete_own"
  on public.study_items for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, trial_ends_at)
  values (new.id, new.email, now() + interval '30 days')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
