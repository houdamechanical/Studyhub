-- Subject choices, corrected: everyone takes Chemistry; the "pick two" group
-- is Physics / Arabic / Biology (not Chemistry). Art OR Music stays.
--
-- Choices made under the old rule (with Chemistry) are cleared, so those
-- students are asked again the next time they open the app.
-- Safe to run more than once.

alter table public.profiles drop constraint if exists profiles_electives_valid;

update public.profiles
set electives = null
where electives is not null
  and not (
    cardinality(electives) = 3
    and electives <@ array['kunst', 'musik', 'physik', 'arabisch', 'bio']
    and electives && array['kunst', 'musik'] and not electives @> array['kunst', 'musik']
    and (electives @> array['physik', 'arabisch'] or electives @> array['physik', 'bio'] or electives @> array['arabisch', 'bio'])
  );

alter table public.profiles add constraint profiles_electives_valid check (
  electives is null or (
    cardinality(electives) = 3
    and electives <@ array['kunst', 'musik', 'physik', 'arabisch', 'bio']
    -- exactly one of Art / Music
    and electives && array['kunst', 'musik'] and not electives @> array['kunst', 'musik']
    -- two different ones of Physics / Arabic / Biology
    and (electives @> array['physik', 'arabisch'] or electives @> array['physik', 'bio'] or electives @> array['arabisch', 'bio'])
  )
);
