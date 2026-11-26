-- Dashboard: today's tasks (private to each user).
--
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.
-- Safe to run again.

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  subject     public.subject_id,
  -- The day the task is for; unfinished tasks carry over to the next days.
  due_on      date not null default current_date,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists tasks_user_due_idx on public.tasks (user_id, due_on);

alter table public.tasks enable row level security;
drop policy if exists "tasks: read own"   on public.tasks;
drop policy if exists "tasks: insert own" on public.tasks;
drop policy if exists "tasks: update own" on public.tasks;
drop policy if exists "tasks: delete own" on public.tasks;
create policy "tasks: read own"   on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "tasks: insert own" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tasks: update own" on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks: delete own" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.tasks to authenticated;
