-- Dépenses : partage dans le couple et garde-fous. Tout est annulé (rollback).
begin;
select set_config('t.a', (select user_id::text from public.members order by joined_at limit 1), true),
       set_config('t.b', (select user_id::text from public.members order by joined_at offset 1 limit 1), true);
set local role authenticated;

-- A paie 30 € de courses partagés 50/50 ; B la voit et peut la corriger
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into public.expenses (label, amount_cents, owed_cents, category, paid_by) values ('Test courses', 3000, 1500, 'courses', auth.uid());
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, true);
update public.expenses set label = 'Test courses bio' where label = 'Test courses';
select set_config('t.r1', (select count(*)::text from public.expenses where label = 'Test courses bio'), true);
-- B rembourse A
insert into public.settlements (from_user, to_user, amount_cents) values (auth.uid(), current_setting('t.a')::uuid, 1500);
select set_config('t.r2', (select count(*)::text from public.settlements where amount_cents = 1500 and from_user = auth.uid()), true);

-- Payeur hors couple : refusé
do $$
begin
  insert into public.expenses (label, amount_cents, owed_cents, paid_by) values ('x', 100, 50, '00000000-0000-0000-0000-000000000000');
  perform set_config('t.r3', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r3', 'refusé', true);
end $$;
-- Part due supérieure au montant : refusée
do $$
begin
  insert into public.expenses (label, amount_cents, owed_cents, paid_by) values ('x', 100, 150, auth.uid());
  perform set_config('t.r4', 'acceptée (PROBLÈME)', true);
exception when others then perform set_config('t.r4', 'refusée', true);
end $$;
-- Se rembourser soi-même : refusé
do $$
begin
  insert into public.settlements (from_user, to_user, amount_cents) values (auth.uid(), auth.uid(), 100);
  perform set_config('t.r5', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r5', 'refusé', true);
end $$;
-- Déplacer une dépense vers un autre couple : interdit (colonne non modifiable)
do $$
begin
  update public.expenses set couple_id = gen_random_uuid() where label = 'Test courses bio';
  perform set_config('t.r6', 'accepté (PROBLÈME)', true);
exception when others then perform set_config('t.r6', 'refusé', true);
end $$;

select current_setting('t.r1') as "B corrige la dépense de A (attendu 1)",
       current_setting('t.r2') as "B enregistre un remboursement (attendu 1)",
       current_setting('t.r3') as "payeur hors couple (attendu refusé)",
       current_setting('t.r4') as "part due > montant (attendu refusée)",
       current_setting('t.r5') as "se rembourser soi-même (attendu refusé)",
       current_setting('t.r6') as "déplacer vers un autre couple (attendu refusé)";
rollback;
