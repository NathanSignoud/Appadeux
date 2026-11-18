-- Test du trigger « Match ! » et de la RLS des swipes. Tout est annulé (rollback) : rien n'est enregistré.
begin;
select set_config('t.a', (select user_id::text from public.members order by joined_at limit 1), true),
       set_config('t.b', (select user_id::text from public.members order by joined_at offset 1 limit 1), true);
set local role authenticated;

-- A dit oui
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.swipes (kind, item_id, liked, payload) values ('movie', 'test-999', true, '{"title":"Film test"}');
select set_config('t.r1', (select count(*)::text from public.matches where item_id = 'test-999'), true);

-- B ne doit pas voir le swipe de A, puis dit oui à son tour
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
select set_config('t.r2', (select count(*)::text from public.swipes where item_id = 'test-999'), true);
insert into public.swipes (kind, item_id, liked, payload) values ('movie', 'test-999', true, '{"title":"Film test"}');
select set_config('t.r3', (select count(*)::text from public.matches where item_id = 'test-999' and source = 'match'), true);

-- B note le match, A voit la note
insert into public.ratings (match_id, stars) select id, 4 from public.matches where item_id = 'test-999';
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
select set_config('t.r4', (select count(*)::text from public.ratings r join public.matches m on m.id = r.match_id where m.item_id = 'test-999'), true);

select current_setting('t.r1') as "matchs après le oui de A (attendu 0)",
       current_setting('t.r2') as "swipes de A vus par B (attendu 0)",
       current_setting('t.r3') as "matchs après le oui de B (attendu 1)",
       current_setting('t.r4') as "notes visibles par A (attendu 1)";
rollback;
