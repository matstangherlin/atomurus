-- Vision identify from the Android app (no accounts yet): scans and feedback
-- are kept per device instead of per user, written only by the server with the
-- service role. They feed the same shared learning signal. Still no photos.

alter table public.vision_scans alter column user_id drop not null;
alter table public.vision_scans add column if not exists device_id text not null default '';
alter table public.vision_scans drop constraint if exists vision_scans_owner;
alter table public.vision_scans add constraint vision_scans_owner
  check (user_id is not null or device_id <> '');
create index if not exists vision_scans_device_created_idx
  on public.vision_scans (device_id, created_at desc) where user_id is null;

alter table public.vision_feedback alter column user_id drop not null;
alter table public.vision_feedback add column if not exists device_id text not null default '';
alter table public.vision_feedback drop constraint if exists vision_feedback_owner;
alter table public.vision_feedback add constraint vision_feedback_owner
  check (user_id is not null or device_id <> '');
create unique index if not exists vision_feedback_device_unique
  on public.vision_feedback (scan_id, detection_index, device_id) where user_id is null;

-- RLS policies compare auth.uid() with user_id, so device rows (user_id null)
-- are invisible to every signed-in user; only the service role reads them.
