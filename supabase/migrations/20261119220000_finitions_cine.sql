-- Phase 5 — Joker veto, séries en cours et compteur de trahisons.

-- ── Veto : 1 par personne et par semaine (lundi → dimanche, heure de Paris) ──────────────────
create table public.vetoes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null, -- lundi de la semaine du veto
  item_id text not null,
  title text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start) -- le « 1 par semaine » est garanti par la base
);
alter table public.vetoes enable row level security;
create policy "vetoes : lecture couple" on public.vetoes for select to authenticated
  using (couple_id = public.my_couple_id());
-- Pas d'écriture directe : seulement via use_veto()
revoke insert, update, delete on public.vetoes from authenticated;

create function public.current_week_start() returns date
language sql stable set search_path = ''
as $$ select date_trunc('week', now() at time zone 'Europe/Paris')::date $$;

-- Retire un match en consommant le veto de la semaine. Erreur « veto_used » s'il est déjà pris.
create function public.use_veto(p_match_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_couple uuid := public.my_couple_id();
  v_match public.matches;
begin
  if auth.uid() is null or v_couple is null then raise exception 'not_member'; end if;
  select * into v_match from public.matches where id = p_match_id and couple_id = v_couple and done_at is null;
  if not found then raise exception 'match_not_found'; end if;
  begin
    insert into public.vetoes (couple_id, user_id, week_start, item_id, title)
    values (v_couple, auth.uid(), public.current_week_start(), v_match.item_id, coalesce(v_match.payload ->> 'title', '?'));
  exception when unique_violation then
    raise exception 'veto_used';
  end;
  delete from public.matches where id = p_match_id;
end $$;
revoke execute on function public.use_veto(uuid) from public, anon;
grant execute on function public.use_veto(uuid) to authenticated;

-- Un match obtenu à deux ne se supprime plus librement : c'est à ça que sert le veto.
-- Les ajouts manuels, eux, restent supprimables.
drop policy "matches : suppression couple" on public.matches;
create policy "matches : suppression des ajouts manuels" on public.matches for delete to authenticated
  using (couple_id = public.my_couple_id() and source = 'manual');

-- ── Séries en cours : où on en est ensemble ──────────────────────────────────────────────────
create table public.shows (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  tmdb_id integer not null,
  payload jsonb not null check (pg_column_size(payload) < 20000), -- type Show de src/lib/tmdb.ts (saisons, affiche)
  season integer not null default 1 check (season between 1 and 100),
  episode integer not null default 0 check (episode between 0 and 1000), -- 0 = saison pas commencée
  added_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  finished boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (couple_id, tmdb_id)
);
alter table public.shows enable row level security;
create policy "shows : lecture couple" on public.shows for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "shows : ajout couple" on public.shows for insert to authenticated
  with check (couple_id = public.my_couple_id() and added_by = auth.uid());
create policy "shows : modif couple" on public.shows for update to authenticated
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "shows : suppression couple" on public.shows for delete to authenticated
  using (couple_id = public.my_couple_id());
revoke update on public.shows from authenticated;
grant update (season, episode, finished, updated_at) on public.shows to authenticated;

-- ── Trahisons : quelqu'un a avancé seul ──────────────────────────────────────────────────────
create table public.betrayals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  show_id uuid references public.shows (id) on delete set null,
  show_name text not null check (char_length(show_name) between 1 and 200), -- reste lisible si la série est retirée
  traitor_id uuid not null references auth.users (id) on delete cascade,
  reported_by uuid not null default auth.uid() references auth.users (id) on delete cascade, -- aveu ou dénonciation
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index betrayals_couple_id_idx on public.betrayals (couple_id);
alter table public.betrayals enable row level security;
create policy "betrayals : lecture couple" on public.betrayals for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "betrayals : ajout couple" on public.betrayals for insert to authenticated
  with check (couple_id = public.my_couple_id() and reported_by = auth.uid()
    and exists (select 1 from public.members m where m.user_id = traitor_id and m.couple_id = public.my_couple_id())
    and (show_id is null or exists (select 1 from public.shows s where s.id = show_id and s.couple_id = public.my_couple_id())));
-- Pardonner (supprimer) : seulement celui qui a déclaré
create policy "betrayals : pardon" on public.betrayals for delete to authenticated
  using (couple_id = public.my_couple_id() and reported_by = auth.uid());
revoke update on public.betrayals from authenticated;

alter publication supabase_realtime add table public.vetoes, public.shows, public.betrayals;
