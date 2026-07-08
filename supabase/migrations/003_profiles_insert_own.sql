-- Allow authenticated users to create their own profile row if the trigger missed it.

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);
