-- Phase 2: exam tracker + grade tracker.
-- Every row belongs to one user; Row Level Security makes sure a user can only
-- ever see and change their own rows.

-- Subjects used across the app. Keep in sync with lib/subjects.ts.
create domain public.subject_id as text
  check (value in ('math', 'deutsch', 'englisch', 'chemie', 'physik', 'bio', 'geschichte', 'religion'));

-- School half-year, e.g. '11.1' = Klasse 11, 1. Halbjahr.
create domain public.semester_id as text
  check (value ~ '^[0-9]{1,2}\.[12]$');

-- ---------------------------------------------------------------------------
-- Exams
-- ---------------------------------------------------------------------------
create table public.exams (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject     public.subject_id not null,
  title       text not null default '' check (char_length(title) <= 120),
  type        text not null default 'klausur'
                check (type in ('klausur', 'test', 'oral', 'presentation', 'other')),
  -- Stored as local wall-clock date/time (no time zone): an exam at 08:00 is at 08:00.
  exam_date   date not null,
  start_time  time,
  room        text not null default '' check (char_length(room) <= 60),
  status      text not null default 'upcoming' check (status in ('upcoming', 'done')),
  notes       text not null default '' check (char_length(notes) <= 1000),
  created_at  timestamptz not null default now()
);

create index exams_user_date_idx on public.exams (user_id, exam_date);

alter table public.exams enable row level security;

create policy "exams: read own"   on public.exams for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "exams: insert own" on public.exams for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "exams: update own" on public.exams for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "exams: delete own" on public.exams for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.exams to authenticated;

-- ---------------------------------------------------------------------------
-- Grades
-- ---------------------------------------------------------------------------
-- `scale` says how `value` is written:
--   grade   = German grade 1.0 (best) – 6.0
--   points  = Oberstufe points 0 – 15 (best)
--   percent = 0 – 100 (best)
create table public.grades (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject     public.subject_id not null,
  semester    public.semester_id not null default '11.1',
  title       text not null default '' check (char_length(title) <= 120),
  scale       text not null default 'grade' check (scale in ('grade', 'points', 'percent')),
  value       numeric(5, 2) not null,
  weight      numeric(5, 2) not null default 1 check (weight > 0 and weight <= 100),
  graded_on   date not null default current_date,
  created_at  timestamptz not null default now(),
  constraint grades_value_in_range check (
       (scale = 'grade'   and value between 1 and 6)
    or (scale = 'points'  and value between 0 and 15)
    or (scale = 'percent' and value between 0 and 100)
  )
);

create index grades_user_semester_idx on public.grades (user_id, semester, graded_on);

alter table public.grades enable row level security;

create policy "grades: read own"   on public.grades for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "grades: insert own" on public.grades for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "grades: update own" on public.grades for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "grades: delete own" on public.grades for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.grades to authenticated;
