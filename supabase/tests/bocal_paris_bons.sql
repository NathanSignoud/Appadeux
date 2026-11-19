-- Bocal (secret jusqu'à la pioche, 1 par jour), paris (étapes), bons (seul le destinataire gratte). Tout est annulé.
begin;
select set_config('t.a', (select user_id::text from public.members order by joined_at limit 1), true),
       set_config('t.b', (select user_id::text from public.members order by joined_at offset 1 limit 1), true);
-- Repartir d'un bocal vierge pour aujourd'hui (annulé au rollback)
delete from public.love_notes;
set local role authenticated;

-- A glisse deux mots pour B
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.love_notes (body) values ('Test mot un'), ('Test mot deux');
-- A ne peut pas piocher ses propres mots
do $$ begin perform public.draw_love_note(); perform set_config('t.r0', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r0', sqlerrm, true); end $$;

-- B ne lit rien avant de piocher, mais sait que 2 mots l'attendent
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
select set_config('t.r1', (select count(*)::text from public.love_notes), true);
select set_config('t.r2', public.love_notes_status() ->> 'waiting', true);
select public.draw_love_note();
select set_config('t.r3', (select count(*)::text from public.love_notes), true);
do $$ begin perform public.draw_love_note(); perform set_config('t.r4', 'acceptée (PROBLÈME)', true);
exception when others then perform set_config('t.r4', sqlerrm, true); end $$;

-- Paris : A propose, A ne peut pas accepter lui-même, B accepte, gagnant A, seul A honore
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.bets (claim, stake) values ('Test : tu t’endors avant la fin', 'un massage');
do $$ begin update public.bets set status = 'accepted' where claim like 'Test :%'; perform set_config('t.r5', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r5', sqlerrm, true); end $$;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
update public.bets set status = 'accepted' where claim like 'Test :%';
update public.bets set winner_id = current_setting('t.a')::uuid where claim like 'Test :%';
do $$ begin update public.bets set honored_at = now() where claim like 'Test :%'; perform set_config('t.r6', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r6', sqlerrm, true); end $$;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
update public.bets set honored_at = now() where claim like 'Test :%';
select set_config('t.r7', (select count(*)::text from public.bets where claim like 'Test :%' and honored_at is not null and settled_at is not null), true);

-- Bons : A offre, A ne peut pas gratter son propre bon (0 ligne), B gratte puis utilise
insert into public.coupons (title) values ('Test petit-déj au lit');
with u as (update public.coupons set scratched_at = now() where title = 'Test petit-déj au lit' returning 1)
select set_config('t.r8', (select count(*)::text from u), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
update public.coupons set scratched_at = now() where title = 'Test petit-déj au lit';
update public.coupons set used_at = now() where title = 'Test petit-déj au lit';
select set_config('t.r9', (select count(*)::text from public.coupons where title = 'Test petit-déj au lit' and used_at is not null), true);

select current_setting('t.r0') as "A pioche ses mots (attendu jar_empty)",
       current_setting('t.r1') as "B lit avant pioche (attendu 0)",
       current_setting('t.r2') as "mots qui attendent B (attendu 2)",
       current_setting('t.r3') as "B lit après pioche (attendu 1)",
       current_setting('t.r4') as "2e pioche du jour (attendu already_drawn_today)",
       current_setting('t.r5') as "accepter son propre pari (attendu bet_not_yours)",
       current_setting('t.r6') as "le perdant honore (attendu bet_transition)",
       current_setting('t.r7') as "gage honoré par le gagnant (attendu 1)",
       current_setting('t.r8') as "gratter son propre bon (attendu 0)",
       current_setting('t.r9') as "B utilise le bon (attendu 1)";
rollback;
