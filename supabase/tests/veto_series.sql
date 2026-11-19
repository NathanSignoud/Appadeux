-- Veto (1 par semaine), protection des matchs, séries et trahisons. Tout est annulé (rollback).
begin;
select set_config('t.a', (select user_id::text from public.members order by joined_at limit 1), true),
       set_config('t.b', (select user_id::text from public.members order by joined_at offset 1 limit 1), true);
-- Le veto de la semaine a peut-être déjà servi pour de vrai : on repart d'une semaine vierge (annulé au rollback)
delete from public.vetoes where week_start = public.current_week_start();
set local role authenticated;

-- A et B swipent deux films à droite → deux vrais matchs
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.swipes (couple_id, kind, item_id, liked, payload) values
  (public.my_couple_id(), 'movie', 'test-1', true, '{"title":"Test un"}'),
  (public.my_couple_id(), 'movie', 'test-2', true, '{"title":"Test deux"}');
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
insert into public.swipes (couple_id, kind, item_id, liked, payload) values
  (public.my_couple_id(), 'movie', 'test-1', true, '{"title":"Test un"}'),
  (public.my_couple_id(), 'movie', 'test-2', true, '{"title":"Test deux"}');

-- Supprimer un vrai match sans veto : 0 ligne (la politique ne vise que les ajouts manuels)
with d as (delete from public.matches where item_id = 'test-1' returning 1)
select set_config('t.r1', (select count(*)::text from d), true);

-- B pose son veto sur test-1 : le match disparaît, le veto est visible
select public.use_veto((select id from public.matches where item_id = 'test-1'));
select set_config('t.r2', (select count(*)::text from public.matches where item_id = 'test-1'), true);
select set_config('t.r3', (select count(*)::text from public.vetoes where title = 'Test un'), true);

-- Second veto de B la même semaine : refusé
do $$
begin
  perform public.use_veto((select id from public.matches where item_id = 'test-2'));
  perform set_config('t.r4', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r4', sqlerrm, true);
end $$;

-- A a toujours le sien
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
select public.use_veto((select id from public.matches where item_id = 'test-2'));
select set_config('t.r5', (select count(*)::text from public.matches where item_id = 'test-2'), true);

-- Série + trahison dénoncée par A contre B
insert into public.shows (tmdb_id, payload) values (999999001, '{"name":"Test série"}');
insert into public.betrayals (show_id, show_name, traitor_id, note)
select id, 'Test série', current_setting('t.b')::uuid, 'épisode 3 en cachette' from public.shows where tmdb_id = 999999001;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
update public.shows set episode = 4 where tmdb_id = 999999001;
select set_config('t.r6', (select episode::text from public.shows where tmdb_id = 999999001), true);
-- B ne peut pas effacer la dénonciation de A
with d as (delete from public.betrayals where show_name = 'Test série' returning 1)
select set_config('t.r7', (select count(*)::text from d), true);
-- Trahison attribuée à quelqu'un hors couple : refusée
do $$
begin
  insert into public.betrayals (show_name, traitor_id) values ('x', '00000000-0000-0000-0000-000000000000');
  perform set_config('t.r8', 'acceptée (PROBLÈME)', true);
exception when others then perform set_config('t.r8', 'refusée', true);
end $$;

select current_setting('t.r1') as "supprimer un vrai match sans veto (attendu 0)",
       current_setting('t.r2') as "match après veto (attendu 0)",
       current_setting('t.r3') as "veto visible (attendu 1)",
       current_setting('t.r4') as "2e veto de la semaine (attendu veto_used)",
       current_setting('t.r5') as "veto de l'autre (attendu 0)",
       current_setting('t.r6') as "B avance la série (attendu 4)",
       current_setting('t.r7') as "B efface la dénonciation (attendu 0)",
       current_setting('t.r8') as "traître hors couple (attendu refusée)";
rollback;
