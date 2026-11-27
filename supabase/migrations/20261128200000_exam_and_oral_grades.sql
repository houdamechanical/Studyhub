-- Grades the way the school counts them.
--
--  * Written (Klausur) grades only for exams in the school's plan: one result
--    (0–15 points) per exam.
--  * Oral grades (mündliche Note): up to two per subject and half-year, 0–15.
--  * A subject's half-year result = 50 % written average + 50 % oral average
--    (if only one part exists yet, that part alone).
--  * The NC and every leaderboard use these results. The old free-form
--    "grades" table is no longer used (kept, not deleted).
--
-- Safe to run more than once.

create table if not exists public.exam_grades (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id    uuid not null references public.school_exams (id) on delete cascade,
  points     smallint not null check (points between 0 and 15),
  updated_at timestamptz not null default now(),
  primary key (user_id, exam_id)
);

create table if not exists public.oral_grades (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  semester   public.semester_id not null,
  subject    public.subject_id not null,
  slot       smallint not null check (slot in (1, 2)),
  points     smallint not null check (points between 0 and 15),
  updated_at timestamptz not null default now(),
  primary key (user_id, semester, subject, slot)
);

alter table public.exam_grades enable row level security;
alter table public.oral_grades enable row level security;

do $$
declare t text;
begin
  foreach t in array array['exam_grades', 'oral_grades'] loop
    execute format('drop policy if exists "%1$s: read own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: insert own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: update own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: delete own" on public.%1$I', t);
    execute format('create policy "%1$s: read own" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: insert own" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: update own" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: delete own" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Every user's result per subject in a half-year, in points (0–15).
-- Internal: only used by the leaderboard functions below.
create or replace function public.subject_points(p_semester text)
returns table (user_id uuid, subject text, points numeric, n int)
language sql
stable
security definer
set search_path = ''
as $$
  with w as (
    select g.user_id, e.subject::text as subject, avg(g.points)::numeric as p, count(*)::int as n
    from public.exam_grades g
    join public.school_exams e on e.id = g.exam_id
    where e.semester = p_semester
    group by g.user_id, e.subject
  ),
  o as (
    select g.user_id, g.subject::text as subject, avg(g.points)::numeric as p, count(*)::int as n
    from public.oral_grades g
    where g.semester = p_semester
    group by g.user_id, g.subject
  )
  select coalesce(w.user_id, o.user_id),
         coalesce(w.subject, o.subject),
         case when w.p is null then o.p when o.p is null then w.p else (w.p + o.p) / 2 end,
         coalesce(w.n, 0) + coalesce(o.n, 0)
  from w full join o on o.user_id = w.user_id and o.subject = w.subject;
$$;
revoke execute on function public.subject_points(text) from public, anon, authenticated;

-- Public leaderboard: NC (all shared subjects) or one subject. Values 0–1 (points / 15).
create or replace function public.get_grade_board(p_subject text, p_semester text)
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
    'board', public.board_json(coalesce((
      select jsonb_agg(jsonb_build_object('user_id', user_id, 'value', score, 'extra', n))
      from (
        select sp.user_id, avg(sp.points) / 15 as score, sum(sp.n)::int as n
        from public.subject_points(p_semester) sp
        join public.grade_shares s on s.user_id = sp.user_id and s.subject = sp.subject
        where p_subject is null or sp.subject = p_subject
        group by sp.user_id
      ) t
    ), '[]'::jsonb)),
    'my_score', (
      select avg(sp.points) / 15
      from public.subject_points(p_semester) sp
      where sp.user_id = v_uid and (p_subject is null or sp.subject = p_subject)
    )
  );
end;
$$;
revoke execute on function public.get_grade_board(text, text) from public, anon;
grant execute on function public.get_grade_board(text, text) to authenticated;

-- Community leaderboard: every member, no sharing needed.
create or replace function public.get_community_board(p_community uuid, p_subject text, p_semester text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_community_member(p_community) then
    raise exception 'not a member' using errcode = '42501';
  end if;
  return public.board_json(coalesce((
    select jsonb_agg(jsonb_build_object('user_id', user_id, 'value', score, 'extra', n))
    from (
      select sp.user_id, avg(sp.points) / 15 as score, sum(sp.n)::int as n
      from public.subject_points(p_semester) sp
      join public.community_members m on m.user_id = sp.user_id and m.community_id = p_community
      where p_subject is null or sp.subject = p_subject
      group by sp.user_id
    ) t
  ), '[]'::jsonb));
end;
$$;
revoke execute on function public.get_community_board(uuid, text, text) from public, anon;
grant execute on function public.get_community_board(uuid, text, text) to authenticated;
