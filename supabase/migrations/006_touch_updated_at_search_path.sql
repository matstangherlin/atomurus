-- Pin search_path on the updated_at trigger function (advisor 0011).

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

grant execute on function public.touch_updated_at() to authenticated, service_role;
