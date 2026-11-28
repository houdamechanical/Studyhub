-- Profile pictures and the (Admin) tag.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.
-- Safe to run again.
--
--  * profiles.avatar: 'a:<name>' = one of the app's animated avatars,
--    'u:<url>' = an uploaded photo, null = initial letter
--  * storage bucket "avatars": everyone can see pictures; each student can
--    only upload, replace or delete files in their own folder (<user id>/…)
--  * admin_ids(): which accounts are admins, so the app can show "(Admin)"

alter table public.profiles add column if not exists avatar text;
alter table public.profiles drop constraint if exists profiles_avatar_valid;
alter table public.profiles add constraint profiles_avatar_valid check (
  avatar is null
  or avatar ~ '^a:[a-z0-9-]{1,24}$'
  or (avatar ~ '^u:https://' and char_length(avatar) <= 500)
);

-- Picture storage (public read, own folder only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: read"       on storage.objects;
drop policy if exists "avatars: upload own" on storage.objects;
drop policy if exists "avatars: update own" on storage.objects;
drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Who is an admin (the admins table itself stays private)
create or replace function public.admin_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select user_id from public.admins;
$$;
revoke execute on function public.admin_ids() from public, anon;
grant execute on function public.admin_ids() to authenticated;
