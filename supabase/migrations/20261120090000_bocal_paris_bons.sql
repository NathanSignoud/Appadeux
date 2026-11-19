-- Bocal à mots doux, paris et gages, bons à gratter. (Le jardin n'a pas de table : il se calcule.)

-- ── Bocal à mots doux ────────────────────────────────────────────────────────────────────────
-- On écrit pour l'autre ; l'autre ne peut lire un mot qu'après l'avoir pioché (1 pioche par jour, via draw_love_note).
create table public.love_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 280),
  drawn_at timestamptz, -- null = encore dans le bocal
  created_at timestamptz not null default now()
);
create index love_notes_couple_id_idx on public.love_notes (couple_id);
alter table public.love_notes enable row level security;
-- L'auteur voit ses mots ; le destinataire seulement ceux qu'il a déjà piochés (garanti ici, pas dans l'UI)
create policy "love_notes : lecture" on public.love_notes for select to authenticated
  using (couple_id = public.my_couple_id() and (author_id = auth.uid() or drawn_at is not null));
create policy "love_notes : ajout" on public.love_notes for insert to authenticated
  with check (couple_id = public.my_couple_id() and author_id = auth.uid() and drawn_at is null);
create policy "love_notes : retrait avant pioche" on public.love_notes for delete to authenticated
  using (couple_id = public.my_couple_id() and author_id = auth.uid() and drawn_at is null);
revoke update on public.love_notes from authenticated;

-- Combien de mots de l'autre m'attendent, et ai-je déjà pioché aujourd'hui (heure de Paris) ?
create function public.love_notes_status() returns json
language sql stable security definer set search_path = ''
as $$
  select json_build_object(
    'waiting', (select count(*) from public.love_notes
                where couple_id = public.my_couple_id() and author_id <> auth.uid() and drawn_at is null),
    'drawn_today', exists (select 1 from public.love_notes
                where couple_id = public.my_couple_id() and author_id <> auth.uid()
                  and (drawn_at at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date)
  )
$$;

-- Secouer le bocal : un mot de l'autre au hasard. Erreurs : already_drawn_today, jar_empty.
create function public.draw_love_note() returns public.love_notes
language plpgsql security definer set search_path = ''
as $$
declare
  v_couple uuid := public.my_couple_id();
  v_note public.love_notes;
begin
  if auth.uid() is null or v_couple is null then raise exception 'not_member'; end if;
  if (public.love_notes_status() ->> 'drawn_today')::boolean then raise exception 'already_drawn_today'; end if;
  select * into v_note from public.love_notes
  where couple_id = v_couple and author_id <> auth.uid() and drawn_at is null
  order by random() limit 1 for update skip locked;
  if not found then raise exception 'jar_empty'; end if;
  update public.love_notes set drawn_at = now() where id = v_note.id returning * into v_note;
  return v_note;
end $$;

revoke execute on function public.love_notes_status() from public, anon;
revoke execute on function public.draw_love_note() from public, anon;
grant execute on function public.love_notes_status() to authenticated;
grant execute on function public.draw_love_note() to authenticated;

-- ── Paris et gages ───────────────────────────────────────────────────────────────────────────
-- proposé → accepté (ou refusé) par l'autre → gagnant désigné → gage honoré (par le gagnant). Le perdant doit l'enjeu.
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  claim text not null check (char_length(trim(claim)) between 1 and 200), -- « Je parie que… »
  stake text not null check (char_length(trim(stake)) between 1 and 120), -- le gage
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'refused')),
  winner_id uuid references auth.users (id) on delete cascade,
  settled_at timestamptz,
  honored_at timestamptz,
  created_at timestamptz not null default now(),
  check (winner_id is null or status = 'accepted'),
  check (honored_at is null or winner_id is not null)
);
create index bets_couple_id_idx on public.bets (couple_id);
alter table public.bets enable row level security;
create policy "bets : lecture couple" on public.bets for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "bets : proposer" on public.bets for insert to authenticated
  with check (couple_id = public.my_couple_id() and created_by = auth.uid()
    and status = 'proposed' and winner_id is null and honored_at is null);
create policy "bets : avancer" on public.bets for update to authenticated
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
-- On retire son pari tant que l'autre n'y a pas répondu
create policy "bets : retirer" on public.bets for delete to authenticated
  using (couple_id = public.my_couple_id() and created_by = auth.uid() and status = 'proposed');
revoke update on public.bets from authenticated;
grant update (status, winner_id, honored_at) on public.bets to authenticated;

-- Les étapes ne se sautent pas et chacun ne fait que ce qui lui revient
create function public.check_bet_transition() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if old.status <> 'proposed' or new.status not in ('accepted', 'refused') then raise exception 'bet_transition'; end if;
    if auth.uid() = old.created_by then raise exception 'bet_not_yours'; end if; -- on ne répond pas à son propre pari
  end if;
  if new.winner_id is distinct from old.winner_id then
    if old.winner_id is not null or new.status <> 'accepted'
       or not exists (select 1 from public.members m where m.user_id = new.winner_id and m.couple_id = old.couple_id) then
      raise exception 'bet_transition';
    end if;
    new.settled_at := now();
  end if;
  if new.honored_at is distinct from old.honored_at then
    if old.honored_at is not null or new.winner_id is null or auth.uid() <> new.winner_id then raise exception 'bet_transition'; end if;
  end if;
  return new;
end $$;
create trigger bets_transition before update on public.bets for each row execute function public.check_bet_transition();

-- ── Bons à gratter ───────────────────────────────────────────────────────────────────────────
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  giver_id uuid not null default auth.uid() references auth.users (id) on delete cascade, -- le destinataire = l'autre
  title text not null check (char_length(trim(title)) between 1 and 80),
  details text check (char_length(details) <= 300),
  look text not null default 'peche' check (look in ('peche', 'menthe', 'beurre', 'violet')),
  scratched_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  check (used_at is null or scratched_at is not null)
);
create index coupons_couple_id_idx on public.coupons (couple_id);
alter table public.coupons enable row level security;
create policy "coupons : lecture couple" on public.coupons for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "coupons : offrir" on public.coupons for insert to authenticated
  with check (couple_id = public.my_couple_id() and giver_id = auth.uid() and scratched_at is null and used_at is null);
-- Gratter et utiliser : seulement celui qui reçoit
create policy "coupons : gratter et utiliser" on public.coupons for update to authenticated
  using (couple_id = public.my_couple_id() and giver_id <> auth.uid())
  with check (couple_id = public.my_couple_id() and giver_id <> auth.uid());
create policy "coupons : reprendre avant usage" on public.coupons for delete to authenticated
  using (couple_id = public.my_couple_id() and giver_id = auth.uid() and used_at is null);
revoke update on public.coupons from authenticated;
grant update (scratched_at, used_at) on public.coupons to authenticated;

alter publication supabase_realtime add table public.love_notes, public.bets, public.coupons;
