-- Art students pick their teacher: Kangas (kng) or McCombie (mcm).
-- Art exams labelled with a teacher's short name in school_exams.title are
-- only shown to that teacher's students. Art students without a teacher yet
-- are asked the next time they open the app. Safe to run more than once.

alter table public.profiles add column if not exists art_teacher text;

alter table public.profiles drop constraint if exists profiles_art_teacher_valid;
alter table public.profiles add constraint profiles_art_teacher_valid
  check (art_teacher is null or art_teacher in ('kng', 'mcm'));
