-- Leaderboard NC = the same grades the app counts.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.
-- Safe to run again.
--
-- subject_points (used by every grade leaderboard, friends and groups) now only
-- counts, like the app's grade book:
--  * subjects the student takes: the core subjects plus their chosen electives
--    (everything while no electives are chosen yet)
--  * Art exams of their own teacher (exams labelled Kng / mcm); unlabelled
--    Art exams count for every Art student
-- Grades left over from a subject someone no longer takes no longer count.

create or replace function public.subject_points(p_semester text)
returns table (user_id uuid, subject text, points numeric, n int)
language sql
stable
security definer
set search_path = ''
as $$
  with takes as (
    -- Does this user take this subject? Electives: Art/Music, Physics/Arabic/Biology.
    select p.user_id, p.electives, lower(coalesce(p.art_teacher, '')) as teacher
    from public.profiles p
  ),
  w as (
    select g.user_id, e.subject::text as subject, avg(g.points)::numeric as p, count(*)::int as n
    from public.exam_grades g
    join public.school_exams e on e.id = g.exam_id
    join takes t on t.user_id = g.user_id
    where e.semester = p_semester
      and (
        e.subject::text not in ('kunst', 'musik', 'physik', 'arabisch', 'bio')
        or t.electives is null
        or e.subject::text = any (t.electives)
      )
      and (
        e.subject::text <> 'kunst'
        or lower(trim(e.title)) not in ('kng', 'mcm')
        or lower(trim(e.title)) = t.teacher
      )
    group by g.user_id, e.subject
  ),
  o as (
    select g.user_id, g.subject::text as subject, avg(g.points)::numeric as p, count(*)::int as n
    from public.oral_grades g
    join takes t on t.user_id = g.user_id
    where g.semester = p_semester
      and (
        g.subject::text not in ('kunst', 'musik', 'physik', 'arabisch', 'bio')
        or t.electives is null
        or g.subject::text = any (t.electives)
      )
    group by g.user_id, g.subject
  )
  select coalesce(w.user_id, o.user_id),
         coalesce(w.subject, o.subject),
         case when w.p is null then o.p when o.p is null then w.p else (w.p + o.p) / 2 end,
         coalesce(w.n, 0) + coalesce(o.n, 0)
  from w full join o on o.user_id = w.user_id and o.subject = w.subject;
$$;
revoke execute on function public.subject_points(text) from public, anon, authenticated;
