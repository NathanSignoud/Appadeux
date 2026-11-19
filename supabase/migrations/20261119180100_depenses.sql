-- Phase 3 — Dépenses communes et remboursements. Montants en centimes.
-- owed_cents = la part de la dépense due par celui qui N'A PAS payé (50/50 → la moitié).
-- Solde = somme des parts dues ± remboursements (calculé côté front, src/features/depenses/money.ts).

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 120),
  amount_cents integer not null check (amount_cents between 1 and 10000000),
  owed_cents integer not null check (owed_cents >= 0),
  category text not null default 'autre'
    check (category in ('courses', 'resto', 'sorties', 'maison', 'voyage', 'transport', 'cadeaux', 'autre')),
  spent_on date not null default current_date,
  paid_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (owed_cents <= amount_cents)
);
create index expenses_couple_spent_idx on public.expenses (couple_id, spent_on desc);

alter table public.expenses enable row level security;
create policy "expenses : lecture couple" on public.expenses for select to authenticated
  using (couple_id = public.my_couple_id());
-- Celui qui a payé doit être l'un des deux membres du couple
create policy "expenses : ajout couple" on public.expenses for insert to authenticated
  with check (couple_id = public.my_couple_id() and created_by = auth.uid()
    and exists (select 1 from public.members m where m.user_id = paid_by and m.couple_id = public.my_couple_id()));
create policy "expenses : modif couple" on public.expenses for update to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id()
    and exists (select 1 from public.members m where m.user_id = paid_by and m.couple_id = public.my_couple_id()));
create policy "expenses : suppression couple" on public.expenses for delete to authenticated
  using (couple_id = public.my_couple_id());
revoke update on public.expenses from authenticated;
grant update (label, amount_cents, owed_cents, category, spent_on, paid_by) on public.expenses to authenticated;

-- « On est quittes » : from_user a remboursé amount_cents à to_user. Pas de modification, suppression = annuler.
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null check (amount_cents between 1 and 100000000),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index settlements_couple_id_idx on public.settlements (couple_id);

alter table public.settlements enable row level security;
create policy "settlements : lecture couple" on public.settlements for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "settlements : ajout couple" on public.settlements for insert to authenticated
  with check (couple_id = public.my_couple_id() and created_by = auth.uid()
    and exists (select 1 from public.members m where m.user_id = from_user and m.couple_id = public.my_couple_id())
    and exists (select 1 from public.members m where m.user_id = to_user and m.couple_id = public.my_couple_id()));
create policy "settlements : suppression couple" on public.settlements for delete to authenticated
  using (couple_id = public.my_couple_id());
revoke update on public.settlements from authenticated;

alter publication supabase_realtime add table public.expenses, public.settlements;
