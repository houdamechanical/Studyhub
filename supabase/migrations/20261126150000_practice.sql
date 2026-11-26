-- Phase 3: question bank, mock exams, mini tests, flashcards with spaced repetition.
--
-- Content (questions, quizzes, decks, cards) is shared by everyone and can only be
-- changed by admins. Answers + explanations live in a separate table that normal
-- users cannot read; attempts are graded inside the database (submit_attempt), so
-- nobody can read answers in advance or write a fake score.

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
-- No policies: the table is not readable or writable through the API.
-- Make yourself admin in the SQL editor (see README):
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
-- type    | options               | solution.answer
-- single  | ["A","B","C"]         | {"choice": 1}
-- multi   | ["A","B","C"]         | {"choices": [0, 2]}
-- numeric | []                    | {"value": 3.5, "tolerance": 0.05}
-- text    | []                    | {"accepted": ["Osmose", "osmosis"]}
create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  key         text unique check (key is null or char_length(key) between 1 and 120),
  subject     public.subject_id not null,
  topic       text not null default '' check (char_length(topic) <= 120),
  type        text not null check (type in ('single', 'multi', 'numeric', 'text')),
  prompt      text not null check (char_length(prompt) between 1 and 4000),
  options     jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  points      int not null default 1 check (points between 1 and 100),
  created_at  timestamptz not null default now()
);
create index questions_subject_idx on public.questions (subject, topic);

create table public.question_solutions (
  question_id  uuid primary key references public.questions (id) on delete cascade,
  answer       jsonb not null check (jsonb_typeof(answer) = 'object'),
  -- Step-by-step explanation, one entry per step.
  explanation  text[] not null default '{}'
);

-- ---------------------------------------------------------------------------
-- Quizzes: mock exams ("mock") and mini tests ("mini")
-- ---------------------------------------------------------------------------
create table public.quizzes (
  id                uuid primary key default gen_random_uuid(),
  key               text unique check (key is null or char_length(key) between 1 and 120),
  kind              text not null check (kind in ('mock', 'mini')),
  subject           public.subject_id not null,
  topic             text not null default '' check (char_length(topic) <= 120),
  title             text not null check (char_length(title) between 1 and 200),
  description       text not null default '' check (char_length(description) <= 2000),
  duration_minutes  int check (duration_minutes between 1 and 600),
  created_at        timestamptz not null default now()
);
create index quizzes_subject_idx on public.quizzes (subject, kind);

create table public.quiz_questions (
  quiz_id      uuid not null references public.quizzes (id) on delete cascade,
  question_id  uuid not null references public.questions (id) on delete cascade,
  position     int not null default 0,
  primary key (quiz_id, question_id)
);
create index quiz_questions_question_idx on public.quiz_questions (question_id);

-- ---------------------------------------------------------------------------
-- Flashcards
-- ---------------------------------------------------------------------------
create table public.decks (
  id          uuid primary key default gen_random_uuid(),
  key         text unique check (key is null or char_length(key) between 1 and 120),
  subject     public.subject_id not null,
  topic       text not null default '' check (char_length(topic) <= 120),
  title       text not null check (char_length(title) between 1 and 200),
  created_at  timestamptz not null default now()
);

create table public.cards (
  id        uuid primary key default gen_random_uuid(),
  key       text unique check (key is null or char_length(key) between 1 and 160),
  deck_id   uuid not null references public.decks (id) on delete cascade,
  front     text not null check (char_length(front) between 1 and 2000),
  back      text not null check (char_length(back) between 1 and 4000),
  position  int not null default 0
);
create index cards_deck_idx on public.cards (deck_id, position);

-- Per-user SM-2 state for each card.
create table public.card_reviews (
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id           uuid not null references public.cards (id) on delete cascade,
  ease              numeric(4, 2) not null default 2.5 check (ease >= 1.3),
  interval_days     int not null default 0 check (interval_days >= 0),
  repetitions       int not null default 0 check (repetitions >= 0),
  due_on            date not null,
  last_reviewed_at  timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- ---------------------------------------------------------------------------
-- Attempts (mock exams + mini tests)
-- ---------------------------------------------------------------------------
create table public.attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quiz_id       uuid not null references public.quizzes (id) on delete cascade,
  timed         boolean not null default false,
  started_at    timestamptz not null default now(),
  deadline      timestamptz,
  submitted_at  timestamptz,
  over_time     boolean not null default false,
  score         numeric(7, 2),
  max_score     numeric(7, 2),
  -- Snapshot after grading: questions, your answers, solutions, explanations.
  review        jsonb
);
create index attempts_user_quiz_idx on public.attempts (user_id, quiz_id, submitted_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.questions          enable row level security;
alter table public.question_solutions enable row level security;
alter table public.quizzes            enable row level security;
alter table public.quiz_questions     enable row level security;
alter table public.decks              enable row level security;
alter table public.cards              enable row level security;
alter table public.card_reviews       enable row level security;
alter table public.attempts           enable row level security;

-- Shared content: every signed-in user can read, only admins can write.
do $$
declare t text;
begin
  foreach t in array array['questions', 'quizzes', 'quiz_questions', 'decks', 'cards'] loop
    execute format('create policy "%1$s: read" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "%1$s: admin insert" on public.%1$I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "%1$s: admin update" on public.%1$I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "%1$s: admin delete" on public.%1$I for delete to authenticated using ((select public.is_admin()))', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Solutions: admins only (students see them in their graded attempt review).
create policy "question_solutions: admin all" on public.question_solutions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, insert, update, delete on public.question_solutions to authenticated;

-- Card reviews: each user only their own.
create policy "card_reviews: read own"   on public.card_reviews for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "card_reviews: insert own" on public.card_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "card_reviews: update own" on public.card_reviews for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "card_reviews: delete own" on public.card_reviews for delete to authenticated
  using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.card_reviews to authenticated;

-- Attempts: users can read their own; creating and grading only via the functions below.
create policy "attempts: read own" on public.attempts for select to authenticated
  using ((select auth.uid()) = user_id);
grant select on public.attempts to authenticated;

-- ---------------------------------------------------------------------------
-- Grading
-- ---------------------------------------------------------------------------
create function public.check_answer(p_type text, p_answer jsonb, p_given jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_answer is null or p_given is null or p_given = 'null'::jsonb then
    return false;
  end if;

  -- Inputs are checked before any cast, so bad input returns false instead of raising.
  case p_type
    when 'single' then
      return jsonb_typeof(p_given) = 'number'
         and p_given = p_answer -> 'choice';

    when 'multi' then
      if jsonb_typeof(p_given) <> 'array'
         or exists (select 1 from jsonb_array_elements(p_given) e where jsonb_typeof(e) <> 'number') then
        return false;
      end if;
      return (select coalesce(array_agg(distinct e order by e), '{}')
                from jsonb_array_elements(p_given) e)
           = (select coalesce(array_agg(distinct e order by e), '{}')
                from jsonb_array_elements(p_answer -> 'choices') e);

    when 'numeric' then
      if not (
           jsonb_typeof(p_given) = 'number'
        or (jsonb_typeof(p_given) = 'string' and (p_given #>> '{}') ~ '^\s*[-+]?[0-9]{1,15}([.,][0-9]{1,10})?\s*$')
      ) then
        return false;
      end if;
      return abs(replace(trim(p_given #>> '{}'), ',', '.')::numeric - (p_answer ->> 'value')::numeric)
             <= coalesce((p_answer ->> 'tolerance')::numeric, 0);

    when 'text' then
      if jsonb_typeof(p_given) <> 'string' then
        return false;
      end if;
      return exists (
        select 1 from jsonb_array_elements_text(p_answer -> 'accepted') acc
        where lower(trim(acc)) = lower(trim(p_given #>> '{}'))
      );

    else
      return false;
  end case;
end;
$$;

-- Start an attempt. Timed mode only applies when the quiz has a duration.
create function public.start_attempt(p_quiz_id uuid, p_timed boolean default false)
returns public.attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_minutes int;
  v_attempt public.attempts;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select duration_minutes into v_minutes from public.quizzes where id = p_quiz_id;
  if not found then
    raise exception 'quiz not found' using errcode = 'P0002';
  end if;

  insert into public.attempts (user_id, quiz_id, timed, deadline)
  values (
    v_uid,
    p_quiz_id,
    p_timed and v_minutes is not null,
    case when p_timed and v_minutes is not null then now() + make_interval(mins => v_minutes) end
  )
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- Grade an attempt. p_answers = {"<question id>": <given answer>, ...}
-- Submitting twice returns the first result unchanged.
create function public.submit_attempt(p_attempt_id uuid, p_answers jsonb)
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
    order by qq.position, qu.created_at
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

revoke execute on function public.start_attempt(uuid, boolean) from public, anon;
revoke execute on function public.submit_attempt(uuid, jsonb) from public, anon;
grant execute on function public.start_attempt(uuid, boolean) to authenticated;
grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;
