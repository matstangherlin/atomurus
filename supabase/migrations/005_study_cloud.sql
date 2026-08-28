-- Study Cloud V1: evolve study_items, add study_progress, RLS, updated_at.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.study_items
  add column if not exists title text not null default '',
  add column if not exists href text not null default '',
  add column if not exists note text not null default '',
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists updated_at timestamptz not null default now();

create index if not exists study_items_user_updated_idx
  on public.study_items (user_id, updated_at desc, id desc);

create index if not exists study_items_user_type_updated_idx
  on public.study_items (user_id, item_type, updated_at desc, id desc);

create index if not exists study_items_tags_gin
  on public.study_items using gin (tags);

drop trigger if exists study_items_touch_updated_at on public.study_items;
create trigger study_items_touch_updated_at
  before update on public.study_items
  for each row execute function public.touch_updated_at();

create table if not exists public.study_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_type text not null check (content_type in ('element', 'molecule', 'calculator', 'article')),
  content_key text not null,
  status text not null default 'started' check (status in ('started', 'in_progress', 'completed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  last_position text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, content_type, content_key)
);

create index if not exists study_progress_user_updated_idx
  on public.study_progress (user_id, updated_at desc, id desc);

create index if not exists study_progress_user_status_idx
  on public.study_progress (user_id, status, updated_at desc);

drop trigger if exists study_progress_touch_updated_at on public.study_progress;
create trigger study_progress_touch_updated_at
  before update on public.study_progress
  for each row execute function public.touch_updated_at();

alter table public.study_progress enable row level security;

drop policy if exists "study_progress_select_own" on public.study_progress;
create policy "study_progress_select_own"
  on public.study_progress for select
  using (auth.uid() = user_id);

drop policy if exists "study_progress_insert_own" on public.study_progress;
create policy "study_progress_insert_own"
  on public.study_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "study_progress_update_own" on public.study_progress;
create policy "study_progress_update_own"
  on public.study_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "study_progress_delete_own" on public.study_progress;
create policy "study_progress_delete_own"
  on public.study_progress for delete
  using (auth.uid() = user_id);

revoke all on table public.study_progress from public, anon;
grant select, insert, update, delete on table public.study_progress to authenticated;
grant all on table public.study_progress to service_role;

grant execute on function public.touch_updated_at() to authenticated, service_role;
