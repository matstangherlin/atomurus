-- Vision identify (Pro): one row per analysed photo and one per user verdict.
-- Photos are never stored; only the model's findings and the user's feedback.

create table if not exists public.vision_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lang text not null default 'pt' check (lang in ('pt', 'en')),
  model text not null,
  summary text not null default '',
  detections jsonb not null default '[]'::jsonb,
  image_bytes integer not null default 0,
  created_at timestamptz not null default now(),
  constraint vision_scans_detections_array check (jsonb_typeof(detections) = 'array'),
  constraint vision_scans_detections_size check (octet_length(detections::text) <= 16384)
);

create index if not exists vision_scans_user_created_idx
  on public.vision_scans (user_id, created_at desc);

create table if not exists public.vision_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  scan_id uuid not null references public.vision_scans (id) on delete cascade,
  detection_index integer not null check (detection_index >= 0 and detection_index < 32),
  element text not null default '',
  label text not null default '',
  correct boolean not null,
  corrected_element text not null default '',
  note text not null default '' check (char_length(note) <= 240),
  created_at timestamptz not null default now(),
  unique (scan_id, detection_index, user_id)
);

create index if not exists vision_feedback_element_idx
  on public.vision_feedback (element, created_at desc);

alter table public.vision_scans enable row level security;
alter table public.vision_feedback enable row level security;

drop policy if exists "vision_scans_select_own" on public.vision_scans;
create policy "vision_scans_select_own" on public.vision_scans for select using ((select auth.uid()) = user_id);
drop policy if exists "vision_scans_insert_own" on public.vision_scans;
create policy "vision_scans_insert_own" on public.vision_scans for insert with check ((select auth.uid()) = user_id);
drop policy if exists "vision_scans_delete_own" on public.vision_scans;
create policy "vision_scans_delete_own" on public.vision_scans for delete using ((select auth.uid()) = user_id);

drop policy if exists "vision_feedback_select_own" on public.vision_feedback;
create policy "vision_feedback_select_own" on public.vision_feedback for select using ((select auth.uid()) = user_id);
drop policy if exists "vision_feedback_insert_own" on public.vision_feedback;
create policy "vision_feedback_insert_own" on public.vision_feedback for insert with check ((select auth.uid()) = user_id);
drop policy if exists "vision_feedback_update_own" on public.vision_feedback;
create policy "vision_feedback_update_own" on public.vision_feedback for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on table public.vision_scans, public.vision_feedback from public, anon;
grant select, insert, delete on table public.vision_scans to authenticated;
grant select, insert, update on table public.vision_feedback to authenticated;
grant all on table public.vision_scans, public.vision_feedback to service_role;

-- Shared learning: precision per element and recent corrections, read by the
-- server with the service role (no user id, no photo). Anonymous by design.
create or replace view public.vision_feedback_stats as
  select element,
         count(*) filter (where correct) as right_count,
         count(*) filter (where not correct) as wrong_count
  from public.vision_feedback
  where element <> ''
  group by element;

revoke all on public.vision_feedback_stats from public, anon, authenticated;
grant select on public.vision_feedback_stats to service_role;
