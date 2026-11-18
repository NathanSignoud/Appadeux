-- Un utilisateur ne doit PAS pouvoir fabriquer un faux « match » à la main (doit échouer). Annulé dans tous les cas.
begin;
select set_config('t.a', (select user_id::text from public.members order by joined_at limit 1), true);
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.matches (kind, item_id, source) values ('movie', 'test-faux', 'match');
rollback;
