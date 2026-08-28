-- Study Sets + Smart Review V1.
-- Composite FKs keep cards/items/events on the same user as their set.

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter table public.study_items
  drop constraint if exists study_items_id_user_key;
alter table public.study_items
  add constraint study_items_id_user_key unique (id, user_id);

create table if not exists public.study_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, user_id)
);

create index if not exists study_sets_user_updated_idx
  on public.study_sets (user_id, updated_at desc);

create table if not exists public.study_set_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  study_set_id uuid not null,
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (study_set_id, item_id),
  unique (id, user_id),
  foreign key (study_set_id, user_id) references public.study_sets (id, user_id) on delete cascade,
  foreign key (item_id, user_id) references public.study_items (id, user_id) on delete cascade
);

create index if not exists study_set_items_user_set_idx
  on public.study_set_items (user_id, study_set_id);

create table if not exists public.study_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  study_set_id uuid not null,
  source_item_id uuid,
  front text not null check (char_length(front) between 1 and 1000),
  back text not null check (char_length(back) between 1 and 3000),
  card_type text not null default 'manual' check (card_type in ('manual', 'generated')),
  template_key text not null default 'manual' check (char_length(template_key) between 1 and 80),
  due_at timestamptz not null default now(),
  interval_days numeric not null default 0 check (interval_days >= 0 and interval_days <= 3650),
  ease_factor numeric not null default 2.5 check (ease_factor >= 1.3 and ease_factor <= 3.0),
  repetitions integer not null default 0 check (repetitions >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  review_state text not null default 'new' check (review_state in ('new', 'learning', 'review')),
  version integer not null default 1 check (version >= 1),
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (study_set_id, user_id) references public.study_sets (id, user_id) on delete cascade,
  foreign key (source_item_id, user_id) references public.study_items (id, user_id) on delete set null
);

create unique index if not exists study_cards_generated_identity_idx
  on public.study_cards (study_set_id, source_item_id, template_key)
  where source_item_id is not null and template_key <> 'manual';

create index if not exists study_cards_user_due_idx
  on public.study_cards (user_id, due_at)
  where suspended = false;

create index if not exists study_cards_user_set_due_idx
  on public.study_cards (user_id, study_set_id, due_at)
  where suspended = false;

create table if not exists public.study_review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid,
  client_event_id uuid not null,
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  previous_interval numeric,
  next_interval numeric,
  previous_ease numeric,
  next_ease numeric,
  reviewed_at timestamptz not null default now(),
  unique (user_id, client_event_id),
  foreign key (card_id, user_id) references public.study_cards (id, user_id) on delete set null
);

create index if not exists study_review_events_user_reviewed_idx
  on public.study_review_events (user_id, reviewed_at desc);

create index if not exists study_cards_set_user_idx
  on public.study_cards (study_set_id, user_id);

create index if not exists study_cards_source_item_user_idx
  on public.study_cards (source_item_id, user_id);

create index if not exists study_set_items_set_user_idx
  on public.study_set_items (study_set_id, user_id);

create index if not exists study_set_items_item_user_idx
  on public.study_set_items (item_id, user_id);

create index if not exists study_review_events_card_user_idx
  on public.study_review_events (card_id, user_id);

drop trigger if exists study_sets_touch_updated_at on public.study_sets;
create trigger study_sets_touch_updated_at
  before update on public.study_sets
  for each row execute function public.touch_updated_at();

drop trigger if exists study_cards_touch_updated_at on public.study_cards;
create trigger study_cards_touch_updated_at
  before update on public.study_cards
  for each row execute function public.touch_updated_at();

alter table public.study_sets enable row level security;
alter table public.study_set_items enable row level security;
alter table public.study_cards enable row level security;
alter table public.study_review_events enable row level security;

drop policy if exists "study_sets_select_own" on public.study_sets;
create policy "study_sets_select_own"
  on public.study_sets for select
  using ((select auth.uid()) = user_id);

drop policy if exists "study_sets_insert_own" on public.study_sets;
create policy "study_sets_insert_own"
  on public.study_sets for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_sets_update_own" on public.study_sets;
create policy "study_sets_update_own"
  on public.study_sets for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_sets_delete_own" on public.study_sets;
create policy "study_sets_delete_own"
  on public.study_sets for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "study_set_items_select_own" on public.study_set_items;
create policy "study_set_items_select_own"
  on public.study_set_items for select
  using ((select auth.uid()) = user_id);

drop policy if exists "study_set_items_insert_own" on public.study_set_items;
create policy "study_set_items_insert_own"
  on public.study_set_items for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_set_items_update_own" on public.study_set_items;
create policy "study_set_items_update_own"
  on public.study_set_items for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_set_items_delete_own" on public.study_set_items;
create policy "study_set_items_delete_own"
  on public.study_set_items for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "study_cards_select_own" on public.study_cards;
create policy "study_cards_select_own"
  on public.study_cards for select
  using ((select auth.uid()) = user_id);

drop policy if exists "study_cards_insert_own" on public.study_cards;
create policy "study_cards_insert_own"
  on public.study_cards for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_cards_update_own" on public.study_cards;
create policy "study_cards_update_own"
  on public.study_cards for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_cards_delete_own" on public.study_cards;
create policy "study_cards_delete_own"
  on public.study_cards for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "study_review_events_select_own" on public.study_review_events;
create policy "study_review_events_select_own"
  on public.study_review_events for select
  using ((select auth.uid()) = user_id);

drop policy if exists "study_review_events_insert_own" on public.study_review_events;
create policy "study_review_events_insert_own"
  on public.study_review_events for insert
  with check ((select auth.uid()) = user_id);

-- Review history is append-only; no update/delete policies for authenticated.

revoke all on table public.study_sets from public, anon;
revoke all on table public.study_set_items from public, anon;
revoke all on table public.study_cards from public, anon;
revoke all on table public.study_review_events from public, anon;

grant select, insert, update, delete on table public.study_sets to authenticated;
grant select, insert, update, delete on table public.study_set_items to authenticated;
grant select, insert, update, delete on table public.study_cards to authenticated;
grant select, insert on table public.study_review_events to authenticated;

grant all on table public.study_sets to service_role;
grant all on table public.study_set_items to service_role;
grant all on table public.study_cards to service_role;
grant all on table public.study_review_events to service_role;

create or replace function private.apply_study_review(
  p_card_id uuid,
  p_client_event_id uuid,
  p_rating text,
  p_expected_version integer,
  p_due_at timestamptz,
  p_interval_days numeric,
  p_ease_factor numeric,
  p_repetitions integer,
  p_lapses integer,
  p_review_state text,
  p_previous_interval numeric,
  p_previous_ease numeric,
  p_reviewed_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  card public.study_cards%rowtype;
  existing public.study_review_events%rowtype;
  updated public.study_cards%rowtype;
  event_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_rating not in ('again', 'hard', 'good', 'easy') then
    raise exception 'invalid_rating' using errcode = '22023';
  end if;

  select * into existing
  from public.study_review_events
  where user_id = uid and client_event_id = p_client_event_id;
  if found then
    select * into updated from public.study_cards where id = existing.card_id and user_id = uid;
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'eventId', existing.id,
      'card', to_jsonb(updated)
    );
  end if;

  select * into card
  from public.study_cards
  where id = p_card_id and user_id = uid
  for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if card.suspended then
    raise exception 'card_suspended' using errcode = 'P0003';
  end if;
  if card.version is distinct from p_expected_version then
    raise exception 'review_conflict' using errcode = 'P0002';
  end if;

  insert into public.study_review_events (
    user_id, card_id, client_event_id, rating,
    previous_interval, next_interval, previous_ease, next_ease, reviewed_at
  ) values (
    uid, card.id, p_client_event_id, p_rating,
    p_previous_interval, p_interval_days, p_previous_ease, p_ease_factor, p_reviewed_at
  )
  returning id into event_id;

  update public.study_cards
  set
    due_at = p_due_at,
    interval_days = p_interval_days,
    ease_factor = p_ease_factor,
    repetitions = p_repetitions,
    lapses = p_lapses,
    review_state = p_review_state,
    version = version + 1,
    updated_at = now()
  where id = card.id and user_id = uid and version = p_expected_version
  returning * into updated;

  if not found then
    raise exception 'review_conflict' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'eventId', event_id,
    'card', to_jsonb(updated)
  );
exception
  when unique_violation then
    select * into existing
    from public.study_review_events
    where user_id = uid and client_event_id = p_client_event_id;
    if found then
      select * into updated from public.study_cards where id = existing.card_id and user_id = uid;
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'eventId', existing.id,
        'card', to_jsonb(updated)
      );
    end if;
    raise;
end;
$$;

create or replace function public.apply_study_review(
  p_card_id uuid,
  p_client_event_id uuid,
  p_rating text,
  p_expected_version integer,
  p_due_at timestamptz,
  p_interval_days numeric,
  p_ease_factor numeric,
  p_repetitions integer,
  p_lapses integer,
  p_review_state text,
  p_previous_interval numeric,
  p_previous_ease numeric,
  p_reviewed_at timestamptz
)
returns jsonb
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.apply_study_review(
    p_card_id,
    p_client_event_id,
    p_rating,
    p_expected_version,
    p_due_at,
    p_interval_days,
    p_ease_factor,
    p_repetitions,
    p_lapses,
    p_review_state,
    p_previous_interval,
    p_previous_ease,
    p_reviewed_at
  );
$$;

revoke all on function private.apply_study_review(
  uuid, uuid, text, integer, timestamptz, numeric, numeric, integer, integer, text, numeric, numeric, timestamptz
) from public, anon;
grant execute on function private.apply_study_review(
  uuid, uuid, text, integer, timestamptz, numeric, numeric, integer, integer, text, numeric, numeric, timestamptz
) to authenticated, service_role;

revoke all on function public.apply_study_review(
  uuid, uuid, text, integer, timestamptz, numeric, numeric, integer, integer, text, numeric, numeric, timestamptz
) from public, anon;
grant execute on function public.apply_study_review(
  uuid, uuid, text, integer, timestamptz, numeric, numeric, integer, integer, text, numeric, numeric, timestamptz
) to authenticated, service_role;
