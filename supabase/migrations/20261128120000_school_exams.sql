-- School exam plan (Klausurplan) for everyone + subject choices.
--
--  * New subjects: Arabic (arabisch), Art (kunst), Music (musik)
--  * profiles.electives: each student picks Art OR Music, and 2 of
--    Biology / Chemistry / Arabic (null = not chosen yet)
--  * school_exams: the official exams, the same for everyone. Students can
--    only read them; admins can change them. The old per-user "exams" table
--    can no longer be written to.
--
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Subjects
-- ---------------------------------------------------------------------------
do $$
declare
  c text;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_type t on t.oid = con.contypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'subject_id' and con.contype = 'c'
  loop
    execute format('alter domain public.subject_id drop constraint %I', c);
  end loop;
end $$;

alter domain public.subject_id add constraint subject_id_check
  check (value in ('math', 'deutsch', 'englisch', 'chemie', 'physik', 'bio', 'geschichte', 'religion',
                   'arabisch', 'kunst', 'musik'));

-- ---------------------------------------------------------------------------
-- Subject choices
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists electives text[];

alter table public.profiles drop constraint if exists profiles_electives_valid;
alter table public.profiles add constraint profiles_electives_valid check (
  electives is null or (
    cardinality(electives) = 3
    and electives <@ array['kunst', 'musik', 'bio', 'chemie', 'arabisch']
    -- exactly one of Art / Music
    and electives && array['kunst', 'musik'] and not electives @> array['kunst', 'musik']
    -- two different ones of Biology / Chemistry / Arabic
    and (electives @> array['bio', 'chemie'] or electives @> array['bio', 'arabisch'] or electives @> array['chemie', 'arabisch'])
  )
);

-- ---------------------------------------------------------------------------
-- The exam plan
-- ---------------------------------------------------------------------------
create table if not exists public.school_exams (
  id         uuid primary key default gen_random_uuid(),
  semester   public.semester_id not null,
  subject    public.subject_id not null,
  exam_date  date not null,
  -- school lessons, e.g. '1-2'
  periods    text not null default '',
  -- only some classes, e.g. '11a-11c' ('' = the whole grade)
  classes    text not null default '',
  -- group / extra info, e.g. teacher 'Kng'
  title      text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists school_exams_date_idx on public.school_exams (semester, exam_date);

alter table public.school_exams enable row level security;
drop policy if exists "school_exams: read" on public.school_exams;
drop policy if exists "school_exams: admin insert" on public.school_exams;
drop policy if exists "school_exams: admin update" on public.school_exams;
drop policy if exists "school_exams: admin delete" on public.school_exams;
create policy "school_exams: read" on public.school_exams for select to authenticated using (true);
create policy "school_exams: admin insert" on public.school_exams for insert to authenticated
  with check (public.is_admin());
create policy "school_exams: admin update" on public.school_exams for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "school_exams: admin delete" on public.school_exams for delete to authenticated
  using (public.is_admin());
grant select, insert, update, delete on public.school_exams to authenticated;

-- Grade 11, first half-year 2026/27 (Klausurplan Herbst, version 2026-08-30)
delete from public.school_exams where semester = '11.1';
insert into public.school_exams (semester, subject, exam_date, periods, classes, title) values
  ('11.1', 'math',       '2026-10-06', '1-2', '',        ''),
  ('11.1', 'arabisch',   '2026-10-18', '6-8', '',        ''),
  ('11.1', 'englisch',   '2026-10-20', '3-4', '',        ''),
  ('11.1', 'geschichte', '2026-10-26', '3-4', '',        ''),
  ('11.1', 'deutsch',    '2026-10-28', '5-7', '',        ''),
  ('11.1', 'physik',     '2026-11-08', '1-2', '',        ''),
  ('11.1', 'chemie',     '2026-11-12', '3-4', '',        ''),
  ('11.1', 'bio',        '2026-11-22', '1-2', '',        ''),
  ('11.1', 'religion',   '2026-11-25', '1-2', '',        ''),
  ('11.1', 'kunst',      '2026-11-30', '6-7', '11a-11c', 'Kng'),
  ('11.1', 'musik',      '2026-11-30', '6-7', '11a-11c', ''),
  ('11.1', 'deutsch',    '2026-12-01', '1-3', '',        ''),
  ('11.1', 'englisch',   '2026-12-03', '1-2', '',        ''),
  ('11.1', 'arabisch',   '2026-12-06', '6-8', '',        ''),
  ('11.1', 'kunst',      '2026-12-07', '6-7', '11a-11c', 'mcm'),
  ('11.1', 'math',       '2026-12-08', '3-4', '',        ''),
  ('11.1', 'kunst',      '2026-12-09', '3-4', '11d',     '');

-- Students can't add or change exams any more (only the plan above counts).
revoke insert, update on public.exams from authenticated;
