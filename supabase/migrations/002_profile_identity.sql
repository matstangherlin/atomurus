-- Atomurus profile identity fields for username login

alter table public.profiles
  add column if not exists username text,
  add column if not exists full_name text;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  add constraint profiles_username_format_chk
  check (username is null or username ~ '^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, full_name, trial_ends_at)
  values (
    new.id,
    new.email,
    lower(coalesce(new.raw_user_meta_data->>'username', null)),
    nullif(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), ''),
    now() + interval '30 days'
  )
  on conflict (id) do update
    set email = excluded.email,
        username = coalesce(excluded.username, public.profiles.username),
        full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;
