-- Pro Lab V1: saved analysis sessions (calculations and comparisons).
-- Private per user. RLS uses (select auth.uid()) to match 007_rls_initplan.

create table if not exists public.pro_lab_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_type text not null check (
    session_type in ('calculation', 'element_compare', 'molecule_compare', 'atomic_compare')
  ),
  title text not null check (char_length(title) between 1 and 120),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint pro_lab_sessions_state_object check (jsonb_typeof(state) = 'object'),
  constraint pro_lab_sessions_state_size check (octet_length(state::text) <= 24576)
);

create index if not exists pro_lab_sessions_user_updated_idx
  on public.pro_lab_sessions (user_id, updated_at desc, id desc);

create index if not exists pro_lab_sessions_user_type_idx
  on public.pro_lab_sessions (user_id, session_type, updated_at desc);

drop trigger if exists pro_lab_sessions_touch_updated_at on public.pro_lab_sessions;
create trigger pro_lab_sessions_touch_updated_at
  before update on public.pro_lab_sessions
  for each row execute function public.touch_updated_at();

alter table public.pro_lab_sessions enable row level security;

drop policy if exists "pro_lab_sessions_select_own" on public.pro_lab_sessions;
create policy "pro_lab_sessions_select_own"
  on public.pro_lab_sessions for select
  using ((select auth.uid()) = user_id);

drop policy if exists "pro_lab_sessions_insert_own" on public.pro_lab_sessions;
create policy "pro_lab_sessions_insert_own"
  on public.pro_lab_sessions for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "pro_lab_sessions_update_own" on public.pro_lab_sessions;
create policy "pro_lab_sessions_update_own"
  on public.pro_lab_sessions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "pro_lab_sessions_delete_own" on public.pro_lab_sessions;
create policy "pro_lab_sessions_delete_own"
  on public.pro_lab_sessions for delete
  using ((select auth.uid()) = user_id);

revoke all on table public.pro_lab_sessions from public, anon;
grant select, insert, update, delete on table public.pro_lab_sessions to authenticated;
grant all on table public.pro_lab_sessions to service_role;
