-- Événements : partage dans le couple et garde-fous. Tout est annulé (rollback).
begin;
select set_config('t.a', (select user_id::text from public.members order by joined_at limit 1), true),
       set_config('t.b', (select user_id::text from public.members order by joined_at offset 1 limit 1), true);
set local role authenticated;

-- A crée un événement à deux ; B le voit et peut le modifier
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.events (title, kind, starts_at, ends_at) values ('Test ciné', 'together', now(), now() + interval '2 hours');
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
select set_config('t.r1', (select count(*)::text from public.events where title = 'Test ciné'), true);
update public.events set pinned = true where title = 'Test ciné';
select set_config('t.r2', (select count(*)::text from public.events where title = 'Test ciné' and pinned), true);

-- B tente de créer un événement au nom de A : refusé par la RLS (on compte via un sous-bloc qui attrape l'erreur)
do $$
begin
  insert into public.events (title, kind, starts_at, ends_at, created_by)
  values ('Usurpation', 'solo', now(), now(), current_setting('t.a')::uuid);
  perform set_config('t.r3', 'accepté (PROBLÈME)', true);
exception when others then
  perform set_config('t.r3', 'refusé', true);
end $$;

-- Absence « à heure » : refusée par la contrainte
do $$
begin
  insert into public.events (title, kind, starts_at, ends_at, all_day) values ('Absence', 'absence', now(), now(), false);
  perform set_config('t.r4', 'acceptée (PROBLÈME)', true);
exception when others then
  perform set_config('t.r4', 'refusée', true);
end $$;

select current_setting('t.r1') as "B voit l'événement de A (attendu 1)",
       current_setting('t.r2') as "B a pu l'épingler (attendu 1)",
       current_setting('t.r3') as "événement au nom de l'autre (attendu refusé)",
       current_setting('t.r4') as "absence à heure (attendu refusée)";
rollback;
