-- Communities: small groups of friends who see each other's grades and chat.
--
--  * Anyone can create a community; others join with its 6-character code.
--  * Members see each other's averages (NC and per subject) – joining is the
--    consent, no per-subject sharing needed inside a community.
--  * Chat messages are only visible to members (Realtime enabled).
--  * New subject: Sport (counts towards the NC like in the school's sheet).
--
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Sport
-- ---------------------------------------------------------------------------
do $$
declare
  c text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_type t on t.oid = con.contypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'subject_id' and con.contype = 'c'
  loop
    execute format('alter domain public.subject_id drop constraint %I', c);
  end loop;
end $$;
alter domain public.subject_id add constraint subject_id_check
  check (value in ('math', 'deutsch', 'englisch', 'chemie', 'physik', 'bio', 'geschichte', 'religion',
                   'arabisch', 'kunst', 'musik', 'sport'));

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.communities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 2 and 40),
  code       text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  -- references profiles so the API can embed the member's nickname
  user_id      uuid not null references public.profiles (user_id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists community_members_user_idx on public.community_members (user_id);

create table if not exists public.community_messages (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id      uuid not null default auth.uid() references public.profiles (user_id) on delete cascade,
  body         text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at   timestamptz not null default now()
);
create index if not exists community_messages_idx on public.community_messages (community_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------
create or replace function public.is_community_member(p_community uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community and user_id = (select auth.uid())
  );
$$;
revoke execute on function public.is_community_member(uuid) from public, anon;
grant execute on function public.is_community_member(uuid) to authenticated;

alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_messages enable row level security;

drop policy if exists "communities: members read" on public.communities;
drop policy if exists "communities: creator deletes" on public.communities;
create policy "communities: members read" on public.communities for select to authenticated
  using (public.is_community_member(id));
create policy "communities: creator deletes" on public.communities for delete to authenticated
  using (created_by = (select auth.uid()));
grant select, delete on public.communities to authenticated;

drop policy if exists "community_members: members read" on public.community_members;
drop policy if exists "community_members: leave" on public.community_members;
create policy "community_members: members read" on public.community_members for select to authenticated
  using (public.is_community_member(community_id));
create policy "community_members: leave" on public.community_members for delete to authenticated
  using (user_id = (select auth.uid()));
grant select, delete on public.community_members to authenticated;

drop policy if exists "community_messages: members read" on public.community_messages;
drop policy if exists "community_messages: members write" on public.community_messages;
drop policy if exists "community_messages: delete own" on public.community_messages;
create policy "community_messages: members read" on public.community_messages for select to authenticated
  using (public.is_community_member(community_id));
create policy "community_messages: members write" on public.community_messages for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_community_member(community_id));
create policy "community_messages: delete own" on public.community_messages for delete to authenticated
  using (user_id = (select auth.uid()));
grant select, insert, delete on public.community_messages to authenticated;

-- ---------------------------------------------------------------------------
-- Create / join (the only ways in)
-- ---------------------------------------------------------------------------
create or replace function public.create_community(p_name text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid;
  v_code text;
  v_abc  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    begin
      insert into public.communities (name, code, created_by)
      values (btrim(p_name), v_code, v_uid)
      returning id into v_id;
      exit;
    exception when unique_violation then
      -- code taken (very rare): try another
    end;
  end loop;
  insert into public.community_members (community_id, user_id) values (v_id, v_uid);
  return jsonb_build_object('id', v_id, 'code', v_code);
end;
$$;

create or replace function public.join_community(p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select id into v_id from public.communities where code = upper(btrim(p_code));
  if v_id is null then
    raise exception 'no community with this code' using errcode = 'P0002';
  end if;
  if (select count(*) from public.community_members where community_id = v_id) >= 60 then
    raise exception 'community is full' using errcode = '54000';
  end if;
  insert into public.community_members (community_id, user_id) values (v_id, v_uid)
  on conflict do nothing;
  return jsonb_build_object('id', v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Leaderboard inside a community: every member, no sharing needed.
-- p_subject null = NC (average of the member's subject averages, like the
-- school's sheet); otherwise that subject. Values are 0–1 scores.
-- ---------------------------------------------------------------------------
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
      select user_id, avg(subject_score) as score, sum(n)::int as n
      from (
        select g.user_id, g.subject,
               sum(public.grade_score(g.scale, g.value) * g.weight) / sum(g.weight) as subject_score,
               count(*) as n
        from public.grades g
        join public.community_members m on m.user_id = g.user_id and m.community_id = p_community
        where g.semester = p_semester
          and (p_subject is null or g.subject = p_subject)
        group by g.user_id, g.subject
      ) per_subject
      group by user_id
    ) t
  ), '[]'::jsonb));
end;
$$;

revoke execute on function public.create_community(text) from public, anon;
revoke execute on function public.join_community(text) from public, anon;
revoke execute on function public.get_community_board(uuid, text, text) from public, anon;
grant execute on function public.create_community(text) to authenticated;
grant execute on function public.join_community(text) to authenticated;
grant execute on function public.get_community_board(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Live chat (Supabase Realtime)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_messages'
     ) then
    alter publication supabase_realtime add table public.community_messages;
  end if;
end $$;
