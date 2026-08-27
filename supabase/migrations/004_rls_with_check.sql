-- Harden profile and study-item updates so users cannot reassign rows.

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "study_items_update_own" on public.study_items;
create policy "study_items_update_own"
  on public.study_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
