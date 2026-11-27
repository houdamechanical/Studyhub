-- Profiles, friends and the mini-test leaderboard.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.
-- Safe to run again.
--
--  * friendships: a request (pending) that the other person accepts
--  * leaderboard rows now carry user_id, so names link to profiles
--  * get_player_stats: a student's public profile – mini-test stats for
--    achievements, number of friends, and your friendship with them
--    (grades stay private: they are never part of a profile)
--  * get_mini_board: XP leaderboard from mini tests (everyone or friends)
--    XP = sum over mini tests of your best result in percent

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  requester   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  addressee   uuid not null references auth.users (id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
-- One friendship per pair, whoever asked first.
create unique index if not exists friendships_pair_unique
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_addressee_idx on public.friendships (addressee);

alter table public.friendships enable row level security;

drop policy if exists "friendships: read own" on public.friendships;
drop policy if exists "friendships: accept"   on public.friendships;
drop policy if exists "friendships: remove"   on public.friendships;
create policy "friendships: read own" on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester, addressee));
-- Only the person who was asked can accept.
create policy "friendships: accept" on public.friendships for update to authenticated
  using ((select auth.uid()) = addressee) with check (status = 'accepted');
-- Either side can cancel a request or end a friendship.
create policy "friendships: remove" on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester, addressee));
grant select, update, delete on public.friendships to authenticated;

-- Send a request; if they already asked you, this accepts theirs instead.
-- Returns the new state: 'outgoing' or 'friends'.
create or replace function public.add_friend(p_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_user is null or p_user = v_uid or not exists (select 1 from public.profiles where user_id = p_user) then
    raise exception 'invalid user' using errcode = '22023';
  end if;

  update public.friendships set status = 'accepted'
  where requester = p_user and addressee = v_uid;
  if found then
    return 'friends';
  end if;

  if exists (select 1 from public.friendships where requester = v_uid and addressee = p_user and status = 'accepted') then
    return 'friends';
  end if;

  insert into public.friendships (requester, addressee) values (v_uid, p_user)
  on conflict do nothing;
  return 'outgoing';
end;
$$;

-- ---------------------------------------------------------------------------
-- Leaderboard rows: add user_id (same shape otherwise)
-- ---------------------------------------------------------------------------
create or replace function public.board_json(p_results jsonb)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with r as (
    select (e ->> 'user_id')::uuid as user_id, (e ->> 'value')::numeric as value, (e ->> 'extra')::int as extra
    from jsonb_array_elements(p_results) e
  ),
  listed as (
    select r.*, p.nickname,
           rank() over (order by r.value desc) as rank
    from r
    join public.profiles p on p.user_id = r.user_id
  )
  select jsonb_build_object(
    'participants', (select count(*) from r),
    'average',      (select avg(value) from r),
    'mine',         (select value from r where user_id = (select auth.uid())),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
               'rank', rank, 'nickname', nickname, 'value', value, 'extra', extra,
               'user_id', user_id,
               'is_me', user_id = (select auth.uid()))
             order by rank, nickname)
      from listed
      where rank <= 100 or user_id = (select auth.uid())
    ), '[]'::jsonb)
  );
$$;
revoke execute on function public.board_json(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Mini-test results per user (best result per mini test, in time only)
-- ---------------------------------------------------------------------------
create or replace function public.mini_best(p_user uuid default null)
returns table (user_id uuid, quiz_id uuid, subject text, best numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select a.user_id, a.quiz_id, q.subject::text, max(a.score / a.max_score) as best
  from public.attempts a
  join public.quizzes q on q.id = a.quiz_id and q.kind = 'mini'
  where a.submitted_at is not null
    and not a.over_time
    and a.max_score > 0
    and (p_user is null or a.user_id = p_user)
  group by a.user_id, a.quiz_id, q.subject;
$$;
revoke execute on function public.mini_best(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- A student's profile
-- ---------------------------------------------------------------------------
create or replace function public.get_player_stats(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_rel text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where user_id = p_user) then
    return null;
  end if;

  select case
           when p_user = v_uid then 'self'
           when f.status = 'accepted' then 'friends'
           when f.requester = v_uid then 'outgoing'
           when f.addressee = v_uid then 'incoming'
           else 'none'
         end
  into v_rel
  from (select 1) one
  left join public.friendships f
    on (f.requester = v_uid and f.addressee = p_user) or (f.requester = p_user and f.addressee = v_uid);

  return (
    with best as (select * from public.mini_best(p_user)),
    att as (
      select a.score, a.max_score, a.submitted_at
      from public.attempts a
      join public.quizzes q on q.id = a.quiz_id and q.kind = 'mini'
      where a.user_id = p_user and a.submitted_at is not null and not a.over_time and a.max_score > 0
    )
    select jsonb_build_object(
      'user_id',      p_user,
      'nickname',     (select nickname from public.profiles where user_id = p_user),
      'joined',       (select created_at from public.profiles where user_id = p_user),
      'relation',     v_rel,
      'friends',      (select count(*) from public.friendships
                        where status = 'accepted' and p_user in (requester, addressee)),
      'xp',           coalesce((select round(sum(best) * 100) from best), 0),
      'tests_done',   (select count(*) from best),
      'subjects',     (select count(distinct subject) from best),
      'best_avg',     (select avg(best) from best),
      'attempts',     (select count(*) from att),
      'perfect',      (select count(*) from att where score >= max_score),
      'days',         (select count(distinct (submitted_at at time zone 'Europe/Berlin')::date) from att)
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Mini-test leaderboard: XP, everyone or only you and your friends
-- ---------------------------------------------------------------------------
create or replace function public.get_mini_board(p_friends boolean default false)
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

  return public.board_json(coalesce((
    select jsonb_agg(jsonb_build_object('user_id', b.user_id, 'value', b.xp, 'extra', b.n))
    from (
      select user_id, round(sum(best) * 100) as xp, count(*)::int as n
      from public.mini_best(null)
      group by user_id
    ) b
    where not p_friends
       or b.user_id = v_uid
       or exists (
         select 1 from public.friendships f
         where f.status = 'accepted'
           and ((f.requester = v_uid and f.addressee = b.user_id) or (f.addressee = v_uid and f.requester = b.user_id))
       )
  ), '[]'::jsonb));
end;
$$;

revoke execute on function public.add_friend(uuid) from public, anon;
revoke execute on function public.get_player_stats(uuid) from public, anon;
revoke execute on function public.get_mini_board(boolean) from public, anon;
grant execute on function public.add_friend(uuid) to authenticated;
grant execute on function public.get_player_stats(uuid) to authenticated;
grant execute on function public.get_mini_board(boolean) to authenticated;
