-- Random mini tests + mini tests off the subject leaderboards.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.
-- Safe to run again.
--
--  * quizzes.draw_count: when set, each attempt draws that many random
--    questions from the quiz's question pool (stored in attempts.question_ids)
--  * submit_attempt grades only the drawn questions
--  * get_subject_board ranks mock exams only; a mini test's own leaderboard
--    (get_quiz_board) is shown after finishing it
--  * Biology 11.1: the 13 small mini tests become 3 random ones
--    (Block 1, Block 2, Transfer – 10 questions each). Results of the old
--    mini tests are deleted with them.

alter table public.quizzes  add column if not exists draw_count int check (draw_count between 1 and 100);
alter table public.attempts add column if not exists question_ids uuid[];

-- ---------------------------------------------------------------------------
-- Start an attempt; for a random quiz, draw its questions now.
-- ---------------------------------------------------------------------------
create or replace function public.start_attempt(p_quiz_id uuid, p_timed boolean default false)
returns public.attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_minutes int;
  v_draw    int;
  v_ids     uuid[];
  v_attempt public.attempts;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select duration_minutes, draw_count into v_minutes, v_draw from public.quizzes where id = p_quiz_id;
  if not found then
    raise exception 'quiz not found' using errcode = 'P0002';
  end if;

  if v_draw is not null then
    select array_agg(question_id) into v_ids
    from (
      select question_id from public.quiz_questions
      where quiz_id = p_quiz_id
      order by random()
      limit v_draw
    ) drawn;
  end if;

  insert into public.attempts (user_id, quiz_id, timed, deadline, question_ids)
  values (
    v_uid,
    p_quiz_id,
    p_timed and v_minutes is not null,
    case when p_timed and v_minutes is not null then now() + make_interval(mins => v_minutes) end,
    v_ids
  )
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grade an attempt (only the drawn questions for random quizzes).
-- ---------------------------------------------------------------------------
create or replace function public.submit_attempt(p_attempt_id uuid, p_answers jsonb)
returns public.attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
  v_review  jsonb := '[]'::jsonb;
  v_score   numeric := 0;
  v_max     numeric := 0;
  v_given   jsonb;
  v_correct boolean;
  q         record;
begin
  select * into v_attempt
  from public.attempts
  where id = p_attempt_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'attempt not found' using errcode = 'P0002';
  end if;
  if v_attempt.submitted_at is not null then
    return v_attempt;
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    p_answers := '{}'::jsonb;
  end if;

  for q in
    select qu.id, qu.type, qu.prompt, qu.options, qu.points, s.answer, s.explanation
    from public.quiz_questions qq
    join public.questions qu on qu.id = qq.question_id
    left join public.question_solutions s on s.question_id = qu.id
    where qq.quiz_id = v_attempt.quiz_id
      -- Random mini tests: only the questions drawn for this attempt, in that order.
      and (v_attempt.question_ids is null or qu.id = any (v_attempt.question_ids))
    order by array_position(v_attempt.question_ids, qu.id), qq.position, qu.created_at
  loop
    v_given   := p_answers -> (q.id::text);
    v_correct := coalesce(public.check_answer(q.type, q.answer, v_given), false);
    v_max     := v_max + q.points;
    if v_correct then
      v_score := v_score + q.points;
    end if;

    v_review := v_review || jsonb_build_array(jsonb_build_object(
      'question_id', q.id,
      'type',        q.type,
      'prompt',      q.prompt,
      'options',     q.options,
      'points',      q.points,
      'given',       coalesce(v_given, 'null'::jsonb),
      'answer',      q.answer,
      'explanation', to_jsonb(coalesce(q.explanation, '{}'::text[])),
      'correct',     v_correct
    ));
  end loop;

  update public.attempts
  set submitted_at = now(),
      -- 30 s grace for network delay when the timer auto-submits
      over_time    = deadline is not null and now() > deadline + interval '30 seconds',
      score        = v_score,
      max_score    = v_max,
      review       = v_review
  where id = v_attempt.id
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- ---------------------------------------------------------------------------
-- Subject leaderboard: mock exams only.
-- ---------------------------------------------------------------------------
create or replace function public.get_subject_board(p_subject text, p_semester text)
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
    -- Tests (mock exams only): per user, the average of their best result in each quiz of this subject.
    'tests', public.board_json(coalesce((
      select jsonb_agg(jsonb_build_object('user_id', user_id, 'value', avg_best, 'extra', quizzes))
      from (
        select user_id, avg(best) as avg_best, count(*)::int as quizzes
        from (
          select a.user_id, a.quiz_id, max(a.score / a.max_score) as best
          from public.attempts a
          join public.quizzes z on z.id = a.quiz_id and z.subject = p_subject and z.kind = 'mock'
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
      where z.subject = p_subject and z.kind = 'mock'
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Biology 11.1: replace the 13 mini tests with 3 random ones.
-- ---------------------------------------------------------------------------
delete from public.quizzes where key like 'bio111-mini-b_-%';

insert into public.quizzes (key, kind, subject, topic, title, description, duration_minutes, draw_count)
values ('bio111-mini-block1', 'mini', 'bio', 'Block 1: Zelle & Membran', 'Mini-Test Block 1: Zelle & Membran', '10 zufällige Fragen – bei jedem Versuch neu gemischt.', 10, 10)
on conflict (key) do update set kind = excluded.kind, subject = excluded.subject, topic = excluded.topic,
  title = excluded.title, description = excluded.description, duration_minutes = excluded.duration_minutes,
  draw_count = excluded.draw_count;
delete from public.quiz_questions where quiz_id = (select id from public.quizzes where key = 'bio111-mini-block1');
insert into public.quiz_questions (quiz_id, question_id, position)
select (select id from public.quizzes where key = 'bio111-mini-block1'), q.id, k.pos - 1
from unnest(array['bio111-q005', 'bio111-q006', 'bio111-q007', 'bio111-q008', 'bio111-q012', 'bio111-q013', 'bio111-q014', 'bio111-q015', 'bio111-q020', 'bio111-q021', 'bio111-q022', 'bio111-q023', 'bio111-q024', 'bio111-q026', 'bio111-q027', 'bio111-q030', 'bio111-q031', 'bio111-q032', 'bio111-q033', 'bio111-q037', 'bio111-q038', 'bio111-q039', 'bio111-q040', 'bio111-q041', 'bio111-q045', 'bio111-q046', 'bio111-q047', 'bio111-q051', 'bio111-q052', 'bio111-q053', 'bio111-q054', 'bio111-q055', 'bio111-q056', 'bio111-q060']) with ordinality as k(key, pos)
join public.questions q on q.key = k.key;

insert into public.quizzes (key, kind, subject, topic, title, description, duration_minutes, draw_count)
values ('bio111-mini-block2', 'mini', 'bio', 'Block 2: Proteine & Enzyme', 'Mini-Test Block 2: Proteine & Enzyme', '10 zufällige Fragen – bei jedem Versuch neu gemischt.', 10, 10)
on conflict (key) do update set kind = excluded.kind, subject = excluded.subject, topic = excluded.topic,
  title = excluded.title, description = excluded.description, duration_minutes = excluded.duration_minutes,
  draw_count = excluded.draw_count;
delete from public.quiz_questions where quiz_id = (select id from public.quizzes where key = 'bio111-mini-block2');
insert into public.quiz_questions (quiz_id, question_id, position)
select (select id from public.quizzes where key = 'bio111-mini-block2'), q.id, k.pos - 1
from unnest(array['bio111-q064', 'bio111-q065', 'bio111-q066', 'bio111-q067', 'bio111-q068', 'bio111-q075', 'bio111-q076', 'bio111-q077', 'bio111-q078', 'bio111-q079', 'bio111-q080', 'bio111-q087', 'bio111-q088', 'bio111-q089', 'bio111-q090', 'bio111-q091', 'bio111-q092', 'bio111-q093', 'bio111-q094', 'bio111-q095', 'bio111-q101', 'bio111-q102', 'bio111-q103', 'bio111-q104', 'bio111-q105', 'bio111-q110', 'bio111-q111', 'bio111-q112', 'bio111-q113', 'bio111-q114', 'bio111-q117', 'bio111-q118', 'bio111-q119', 'bio111-q125', 'bio111-q126', 'bio111-q127', 'bio111-q128', 'bio111-q129', 'bio111-q130', 'bio111-q131']) with ordinality as k(key, pos)
join public.questions q on q.key = k.key;

insert into public.quizzes (key, kind, subject, topic, title, description, duration_minutes, draw_count)
values ('bio111-mini-transfer', 'mini', 'bio', 'Transfer', 'Mini-Test Transfer', '10 zufällige Fragen – bei jedem Versuch neu gemischt.', 10, 10)
on conflict (key) do update set kind = excluded.kind, subject = excluded.subject, topic = excluded.topic,
  title = excluded.title, description = excluded.description, duration_minutes = excluded.duration_minutes,
  draw_count = excluded.draw_count;
delete from public.quiz_questions where quiz_id = (select id from public.quizzes where key = 'bio111-mini-transfer');
insert into public.quiz_questions (quiz_id, question_id, position)
select (select id from public.quizzes where key = 'bio111-mini-transfer'), q.id, k.pos - 1
from unnest(array['bio111-q132', 'bio111-q133', 'bio111-q134', 'bio111-q135', 'bio111-q136', 'bio111-q137', 'bio111-q138', 'bio111-q139', 'bio111-q140', 'bio111-q141', 'bio111-q142', 'bio111-q143', 'bio111-q144', 'bio111-q145', 'bio111-q146', 'bio111-q147', 'bio111-q148', 'bio111-q149', 'bio111-q150', 'bio111-q151', 'bio111-q152', 'bio111-q153', 'bio111-q154', 'bio111-q155', 'bio111-q156', 'bio111-q157', 'bio111-q158', 'bio111-q159', 'bio111-q160', 'bio111-q161', 'bio111-q162', 'bio111-q163', 'bio111-q164']) with ordinality as k(key, pos)
join public.questions q on q.key = k.key;
