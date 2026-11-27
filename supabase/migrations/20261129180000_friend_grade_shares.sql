-- Share your grades with single friends.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.
-- Needs 20261129150000_friends_profiles.sql first. Safe to run again.
--
--  * friend_grade_shares: you (owner) let one friend (viewer) see your NC
--    and subject averages – never single grades
--  * shares disappear when the friendship ends
--  * get_friends: your friends with XP, mini tests and – if they share with
--    you – their NC score for the half-year

create table if not exists public.friend_grade_shares (
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  viewer      uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (owner, viewer),
  check (owner <> viewer)
);
create index if not exists friend_grade_shares_viewer_idx on public.friend_grade_shares (viewer);

alter table public.friend_grade_shares enable row level security;

drop policy if exists "friend_grade_shares: read" on public.friend_grade_shares;
drop policy if exists "friend_grade_shares: share with friend" on public.friend_grade_shares;
drop policy if exists "friend_grade_shares: stop sharing" on public.friend_grade_shares;
create policy "friend_grade_shares: read" on public.friend_grade_shares for select to authenticated
  using ((select auth.uid()) in (owner, viewer));
-- Only with someone who is your friend.
create policy "friend_grade_shares: share with friend" on public.friend_grade_shares for insert to authenticated
  with check (
    owner = (select auth.uid())
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester = owner and f.addressee = viewer) or (f.requester = viewer and f.addressee = owner))
    )
  );
create policy "friend_grade_shares: stop sharing" on public.friend_grade_shares for delete to authenticated
  using (owner = (select auth.uid()));
grant select, insert, delete on public.friend_grade_shares to authenticated;

-- Ending a friendship ends sharing in both directions.
create or replace function public.drop_friend_shares()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.friend_grade_shares
  where (owner = old.requester and viewer = old.addressee)
     or (owner = old.addressee and viewer = old.requester);
  return old;
end;
$$;
drop trigger if exists friendships_drop_shares on public.friendships;
create trigger friendships_drop_shares after delete on public.friendships
  for each row execute function public.drop_friend_shares();

-- Your friends: XP from mini tests, and their NC score if they share with you.
-- score = average points / 15 over their subjects this half-year (like the leaderboard).
create or replace function public.get_friends(p_semester text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  return coalesce((
    with fr as (
      select case when f.requester = v_uid then f.addressee else f.requester end as user_id
      from public.friendships f
      where f.status = 'accepted' and v_uid in (f.requester, f.addressee)
    ),
    mini as (
      select user_id, round(sum(best) * 100) as xp, count(*)::int as tests
      from public.mini_best(null)
      where user_id in (select user_id from fr)
      group by user_id
    ),
    grades as (
      select sp.user_id, avg(sp.points) / 15 as score
      from public.subject_points(p_semester) sp
      where sp.user_id in (select owner from public.friend_grade_shares where viewer = v_uid)
      group by sp.user_id
    )
    select jsonb_agg(jsonb_build_object(
             'user_id',    fr.user_id,
             'nickname',   p.nickname,
             'xp',         coalesce(m.xp, 0),
             'tests',      coalesce(m.tests, 0),
             'they_share', exists (select 1 from public.friend_grade_shares s where s.owner = fr.user_id and s.viewer = v_uid),
             'i_share',    exists (select 1 from public.friend_grade_shares s where s.owner = v_uid and s.viewer = fr.user_id),
             'score',      g.score
           ) order by lower(p.nickname))
    from fr
    join public.profiles p on p.user_id = fr.user_id
    left join mini m on m.user_id = fr.user_id
    left join grades g on g.user_id = fr.user_id
  ), '[]'::jsonb);
end;
$$;
revoke execute on function public.get_friends(text) from public, anon;
grant execute on function public.get_friends(text) to authenticated;
