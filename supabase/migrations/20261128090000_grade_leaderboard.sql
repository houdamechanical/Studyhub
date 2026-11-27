-- Leaderboard = grades only (real exam results, no mock exams).
--
--  * get_grade_board(null, semester)    -> overall: each person's average over
--    the subjects they share (every shared subject counts the same)
--  * get_grade_board('bio', semester)   -> one subject
--
-- Privacy stays as before: grades of a subject you did not share are never used
-- for anything others see. `my_score` is your own average over ALL your grades
-- (only returned to you).

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
        select user_id, avg(subject_score) as score, sum(n)::int as n
        from (
          select g.user_id, g.subject,
                 sum(public.grade_score(g.scale, g.value) * g.weight) / sum(g.weight) as subject_score,
                 count(*) as n
          from public.grades g
          join public.grade_shares s on s.user_id = g.user_id and s.subject = g.subject
          where g.semester = p_semester
            and (p_subject is null or g.subject = p_subject)
          group by g.user_id, g.subject
        ) per_subject
        group by user_id
      ) t
    ), '[]'::jsonb)),

    'my_score', (
      select avg(subject_score)
      from (
        select sum(public.grade_score(g.scale, g.value) * g.weight) / sum(g.weight) as subject_score
        from public.grades g
        where g.user_id = v_uid and g.semester = p_semester
          and (p_subject is null or g.subject = p_subject)
        group by g.subject
      ) mine
    )
  );
end;
$$;

revoke execute on function public.get_grade_board(text, text) from public, anon;
grant execute on function public.get_grade_board(text, text) to authenticated;

-- Sharing used an upsert, which needs UPDATE. The app now inserts with
-- "ignore duplicates", but allow the update too so older app versions work.
grant update on public.grade_shares to authenticated;
drop policy if exists "grade_shares: update own" on public.grade_shares;
create policy "grade_shares: update own" on public.grade_shares for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
