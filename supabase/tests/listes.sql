-- Listes : partage dans le couple et SECRET de la liste cadeaux. Tout est annulé (rollback).
begin;
select set_config('t.a', (select user_id::text from public.members order by joined_at limit 1), true),
       set_config('t.b', (select user_id::text from public.members order by joined_at offset 1 limit 1), true);
set local role authenticated;

-- A crée une liste partagée et une liste secrète, avec un élément dans chacune
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.lists (title) values ('Test courses');
insert into public.lists (title, owner_id) values ('Test cadeaux', auth.uid());
insert into public.list_items (list_id, text) select id, 'lait' from public.lists where title = 'Test courses';
insert into public.list_items (list_id, text) select id, 'montre' from public.lists where title = 'Test cadeaux';
select set_config('t.secret_id', (select id::text from public.lists where title = 'Test cadeaux'), true);

-- B : voit la liste partagée et peut cocher, ne voit RIEN du secret
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
update public.list_items set done = true where text = 'lait';
select set_config('t.r1', (select count(*)::text from public.list_items where text = 'lait' and done), true);
select set_config('t.r2', (select count(*)::text from public.lists where title = 'Test cadeaux'), true);
select set_config('t.r3', (select count(*)::text from public.list_items where text = 'montre'), true);
-- B tente de renommer / vider le secret en visant son id : 0 ligne touchée
with u as (update public.lists set title = 'piraté' where id = current_setting('t.secret_id')::uuid returning 1)
select set_config('t.r4', (select count(*)::text from u), true);
with d as (delete from public.list_items where list_id = current_setting('t.secret_id')::uuid returning 1)
select set_config('t.r5', (select count(*)::text from d), true);
-- B tente d'ajouter un élément dans le secret de A : refusé
do $$
begin
  insert into public.list_items (list_id, text) values (current_setting('t.secret_id')::uuid, 'espion');
  perform set_config('t.r6', 'accepté (PROBLÈME)', true);
exception when others then
  perform set_config('t.r6', 'refusé', true);
end $$;
-- B tente de créer une liste secrète au nom de A : refusé
do $$
begin
  insert into public.lists (title, owner_id) values ('faux secret', current_setting('t.a')::uuid);
  perform set_config('t.r7', 'accepté (PROBLÈME)', true);
exception when others then
  perform set_config('t.r7', 'refusé', true);
end $$;

-- A voit toujours son secret intact
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
select set_config('t.r8', (select count(*)::text from public.list_items i join public.lists l on l.id = i.list_id where l.title = 'Test cadeaux'), true);

select current_setting('t.r1') as "B coche un élément partagé (attendu 1)",
       current_setting('t.r2') as "B voit la liste secrète (attendu 0)",
       current_setting('t.r3') as "B voit l'élément secret (attendu 0)",
       current_setting('t.r4') as "B renomme le secret (attendu 0)",
       current_setting('t.r5') as "B vide le secret (attendu 0)",
       current_setting('t.r6') as "B ajoute dans le secret (attendu refusé)",
       current_setting('t.r7') as "secret au nom de l'autre (attendu refusé)",
       current_setting('t.r8') as "A voit son secret (attendu 1)";
rollback;
