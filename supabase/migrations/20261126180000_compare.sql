-- Phase 4: compare with others.
--
-- Rules:
--  * Others only ever see your nickname, never your email or name. Every user
--    gets a generated nickname (e.g. "Student-k3f9a") and can change it.
--  * Test results (mini tests + mock exams) are visible to everyone on leaderboards.
--  * Grades are private unless you share a subject (off by default, per subject).
--    Grades of subjects you did not share are never used for anything others see,
--    not even averages.
--  * Other users' rows are never readable directly: all comparisons go through
--    the functions below, which return only the data described above.

-- ---------------------------------------------------------------------------
-- Profiles (public nickname)
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id               uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- 3–20 characters: letters (incl. German umlauts and Arabic), digits, _ . -
  -- No "@", so an email address can't be used as nickname.
  nickname              text not null check (nickname ~ '^[A-Za-z0-9ÄÖÜäöüß_.\-ء-ي٠-٩]{3,20}$'),
  created_at            timestamptz not null default now()
);
create unique index profiles_nickname_unique on public.profiles (lower(nickname));

-- Every user gets a nickname automatically, so nobody shows up without one.
create function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nick text;
begin
  loop
    v_nick := 'Student-' || substr(md5(random()::text || new.id::text), 1, 5);
    begin
      insert into public.profiles (user_id, nickname) values (new.id, v_nick);
      exit;
    exception when unique_violation then
      -- nickname collision (very rare): try another one
    end;
  end loop;
  return new;
end;
$$;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_user();

-- Existing users
insert into public.profiles (user_id, nickname)
select u.id, 'Student-' || substr(md5(u.id::text), 1, 5)
from auth.users u
on conflict do nothing;

alter table public.profiles enable row level security;
-- Nicknames are public by design (that's all a profile holds).
create policy "profiles: read"       on public.profiles for select to authenticated using (true);
create policy "profiles: insert own" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "profiles: update own" on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles: delete own" on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Grade sharing: one row per subject a user chose to share (none by default)
-- ---------------------------------------------------------------------------
create table public.grade_shares (
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject  public.subject_id not null,
  primary key (user_id, subject)
);

alter table public.grade_shares enable row level security;
create policy "grade_shares: read own"   on public.grade_shares for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "grade_shares: insert own" on public.grade_shares for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "grade_shares: delete own" on public.grade_shares for delete to authenticated
  using ((select auth.uid()) = user_id);
grant select, insert, delete on public.grade_shares to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- Same linear 0–1 score as lib/grades.ts: grade 1.0 / 15 P / 100 % = 1.
create function public.grade_score(p_scale text, p_value numeric)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case p_scale
    when 'grade'   then (6 - p_value) / 5
    when 'points'  then p_value / 15
    when 'percent' then p_value / 100
  end;
$$;

-- Leaderboard JSON for a set of (user_id, value[, extra]) results.
--   rows: nickname + value, best first, top 100 + yourself
--   participants / average: everyone in p_results
--   mine: your own value
create function public.board_json(p_results jsonb)
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
               'is_me', user_id = (select auth.uid()))
             order by rank, nickname)
      from listed
      where rank <= 100 or user_id = (select auth.uid())
    ), '[]'::jsonb)
  );
$$;
-- Only callable from the functions below.
revoke execute on function public.board_json(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Leaderboard for one quiz (mini test or mock exam)
-- value = best share of points (0–1) per user, late submissions excluded
-- ---------------------------------------------------------------------------
create function public.get_quiz_board(p_quiz_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  return public.board_json(coalesce((
    select jsonb_agg(jsonb_build_object('user_id', user_id, 'value', best, 'extra', n))
    from (
      select a.user_id, max(a.score / a.max_score) as best, count(*)::int as n
      from public.attempts a
      where a.quiz_id = p_quiz_id
        and a.submitted_at is not null
        and not a.over_time
        and a.max_score > 0
      group by a.user_id
    ) best
  ), '[]'::jsonb));
end;
$$;

-- ---------------------------------------------------------------------------
-- Subject overview: test leaderboard, grade leaderboard, per-quiz me vs average
-- ---------------------------------------------------------------------------
create function public.get_subject_board(p_subject text, p_semester text)
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

  return jsonb_build_object(
    -- Tests: per user, the average of their best result in each quiz of this subject.
    'tests', public.board_json(coalesce((
      select jsonb_agg(jsonb_build_object('user_id', user_id, 'value', avg_best, 'extra', quizzes))
      from (
        select user_id, avg(best) as avg_best, count(*)::int as quizzes
        from (
          select a.user_id, a.quiz_id, max(a.score / a.max_score) as best
          from public.attempts a
          join public.quizzes z on z.id = a.quiz_id and z.subject = p_subject
          where a.submitted_at is not null and not a.over_time and a.max_score > 0
          group by a.user_id, a.quiz_id
        ) per_quiz
        group by user_id
      ) t
    ), '[]'::jsonb)),

    -- Grades: ONLY users who shared this subject. Weighted average score (0–1).
    'grades', public.board_json(coalesce((
      select jsonb_agg(jsonb_build_object('user_id', user_id, 'value', score, 'extra', n))
      from (
        select g.user_id,
               sum(public.grade_score(g.scale, g.value) * g.weight) / sum(g.weight) as score,
               count(*)::int as n
        from public.grades g
        join public.grade_shares s on s.user_id = g.user_id and s.subject = g.subject
        where g.subject = p_subject and g.semester = p_semester
        group by g.user_id
      ) t
    ), '[]'::jsonb)),

    -- Your own grade average in this subject (always visible to you, shared or not).
    'my_grade', (
      select sum(public.grade_score(g.scale, g.value) * g.weight) / sum(g.weight)
      from public.grades g
      where g.user_id = v_uid and g.subject = p_subject and g.semester = p_semester
    ),

    -- Each quiz of the subject: your best vs. the average best.
    'quizzes', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', z.id, 'title', z.title, 'kind', z.kind,
               'participants', coalesce(s.participants, 0),
               'average', s.average,
               'mine', s.mine)
             order by z.kind desc, z.title)
      from public.quizzes z
      left join lateral (
        select count(*)::int as participants,
               avg(best) as average,
               max(best) filter (where user_id = v_uid) as mine
        from (
          select a.user_id, max(a.score / a.max_score) as best
          from public.attempts a
          where a.quiz_id = z.id and a.submitted_at is not null and not a.over_time and a.max_score > 0
          group by a.user_id
        ) b
      ) s on true
      where z.subject = p_subject
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.get_quiz_board(uuid) from public, anon;
revoke execute on function public.get_subject_board(text, text) from public, anon;
grant execute on function public.get_quiz_board(uuid) to authenticated;
grant execute on function public.get_subject_board(text, text) to authenticated;
