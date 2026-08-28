-- Evaluate auth.uid() once per statement (advisor 0003 / auth_rls_initplan).

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "study_items_select_own" on public.study_items;
create policy "study_items_select_own"
  on public.study_items for select
  using ((select auth.uid()) = user_id);

drop policy if exists "study_items_insert_own" on public.study_items;
create policy "study_items_insert_own"
  on public.study_items for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_items_update_own" on public.study_items;
create policy "study_items_update_own"
  on public.study_items for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_items_delete_own" on public.study_items;
create policy "study_items_delete_own"
  on public.study_items for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "study_progress_select_own" on public.study_progress;
create policy "study_progress_select_own"
  on public.study_progress for select
  using ((select auth.uid()) = user_id);

drop policy if exists "study_progress_insert_own" on public.study_progress;
create policy "study_progress_insert_own"
  on public.study_progress for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_progress_update_own" on public.study_progress;
create policy "study_progress_update_own"
  on public.study_progress for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_progress_delete_own" on public.study_progress;
create policy "study_progress_delete_own"
  on public.study_progress for delete
  using ((select auth.uid()) = user_id);
