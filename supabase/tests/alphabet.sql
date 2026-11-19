-- Alphabet des dates : partage dans le couple, photos rangées dans le dossier du couple. Tout est annulé (rollback).
begin;
select set_config('t.a', (select user_id::text from public.members order by joined_at limit 1), true),
       set_config('t.b', (select user_id::text from public.members order by joined_at offset 1 limit 1), true),
       set_config('t.c', (select couple_id::text from public.members limit 1), true);
set local role authenticated;

-- A planifie la lettre Q (peu probable qu'elle existe déjà) ; B la passe en « faite »
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.alphabet_letters (letter, title, status) values ('Q', 'Test quiz', 'planned');
select set_config('t.lid', (select id::text from public.alphabet_letters where letter = 'Q'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
update public.alphabet_letters set status = 'done' where letter = 'Q';
select set_config('t.r1', (select status from public.alphabet_letters where letter = 'Q'), true);

-- Photo bien rangée : acceptée (ligne + fichier Storage)
insert into public.alphabet_photos (letter_id, path)
values (current_setting('t.lid')::uuid, current_setting('t.c') || '/' || current_setting('t.lid') || '/test.jpg');
insert into storage.objects (bucket_id, name) values ('alphabet', current_setting('t.c') || '/' || current_setting('t.lid') || '/test.jpg');
select set_config('t.r2', (select count(*)::text from storage.objects where bucket_id = 'alphabet' and name like current_setting('t.c') || '/%test.jpg'), true);

-- Photo hors du dossier du couple : refusée (ligne)
do $$
begin
  insert into public.alphabet_photos (letter_id, path) values (current_setting('t.lid')::uuid, 'autre-couple/x.jpg');
  perform set_config('t.r3', 'acceptée (PROBLÈME)', true);
exception when others then perform set_config('t.r3', 'refusée', true);
end $$;
-- Fichier hors du dossier du couple : refusé (Storage)
do $$
begin
  insert into storage.objects (bucket_id, name) values ('alphabet', '00000000-0000-0000-0000-000000000000/x.jpg');
  perform set_config('t.r4', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r4', 'refusé', true);
end $$;
-- Organisateur hors couple : refusé
do $$
begin
  update public.alphabet_letters set organizer_id = '00000000-0000-0000-0000-000000000000' where letter = 'Q';
  perform set_config('t.r5', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r5', 'refusé', true);
end $$;
-- Lettre invalide : refusée
do $$
begin
  insert into public.alphabet_letters (letter) values ('AA');
  perform set_config('t.r6', 'acceptée (PROBLÈME)', true);
exception when others then perform set_config('t.r6', 'refusée', true);
end $$;

select current_setting('t.r1') as "B marque la lettre de A (attendu done)",
       current_setting('t.r2') as "fichier dans le dossier du couple (attendu 1)",
       current_setting('t.r3') as "photo hors dossier (attendu refusée)",
       current_setting('t.r4') as "fichier hors dossier (attendu refusé)",
       current_setting('t.r5') as "organisateur hors couple (attendu refusé)",
       current_setting('t.r6') as "lettre AA (attendu refusée)";
rollback;
