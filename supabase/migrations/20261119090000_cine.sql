-- Phase 1 — Ciné : swipes génériques, matchs (= watchlist pour les films), notes, abonnements.
-- Le moteur de swipe est générique : `kind` dit ce qu'on swipe ('movie' aujourd'hui, 'restaurant' demain).

-- Abonnements streaming du couple (ids de « watch providers » TMDB), réglés dans les paramètres
alter table public.couples add column streaming_providers integer[] not null default '{}';
grant update (streaming_providers) on public.couples to authenticated;
create policy "couples : modif des abonnements de mon couple"
  on public.couples for update to authenticated
  using (id = public.my_couple_id())
  with check (id = public.my_couple_id());

-- Swipes : un avis par personne et par élément. Chacun ne voit QUE les siens (pas de spoiler sur l'autre).
create table public.swipes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  kind text not null check (kind ~ '^[a-z_]{1,30}$'),
  item_id text not null check (char_length(item_id) between 1 and 100),
  liked boolean not null,
  -- instantané de la carte (titre, affiche…) : sert à créer le match sans rappeler l'API
  payload jsonb not null default '{}' check (pg_column_size(payload) < 20000),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);
create index swipes_likes_idx on public.swipes (couple_id, kind, item_id) where liked;

alter table public.swipes enable row level security;
create policy "swipes : lecture des miens" on public.swipes for select to authenticated
  using (user_id = auth.uid());
create policy "swipes : ajout des miens" on public.swipes for insert to authenticated
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "swipes : modif des miens" on public.swipes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());

-- Matchs : ce que les deux veulent (source 'match') ou ce qu'on a ajouté à la main (source 'manual').
-- Pour les films, c'est la watchlist commune ; done_at = « Vu ».
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  kind text not null check (kind ~ '^[a-z_]{1,30}$'),
  item_id text not null check (char_length(item_id) between 1 and 100),
  payload jsonb not null default '{}' check (pg_column_size(payload) < 20000),
  source text not null default 'manual' check (source in ('match', 'manual')),
  added_by uuid default auth.uid() references auth.users (id) on delete set null,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (couple_id, kind, item_id)
);

alter table public.matches enable row level security;
create policy "matches : lecture couple" on public.matches for select to authenticated
  using (couple_id = public.my_couple_id());
-- À la main, on ne peut ajouter que des 'manual' : les vrais matchs viennent uniquement du trigger
create policy "matches : ajout manuel couple" on public.matches for insert to authenticated
  with check (couple_id = public.my_couple_id() and source = 'manual' and added_by = auth.uid());
create policy "matches : modif couple" on public.matches for update to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());
create policy "matches : suppression couple" on public.matches for delete to authenticated
  using (couple_id = public.my_couple_id());
-- Seul « Vu » est modifiable
revoke update on public.matches from authenticated;
grant update (done_at) on public.matches to authenticated;

-- Match ! Quand quelqu'un dit oui, on regarde si l'autre a déjà dit oui.
-- SECURITY DEFINER : il faut lire le swipe de l'autre, invisible pour l'utilisateur.
create function public.handle_swipe_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.liked and exists (
    select 1 from public.swipes s
    where s.couple_id = new.couple_id
      and s.kind = new.kind
      and s.item_id = new.item_id
      and s.user_id <> new.user_id
      and s.liked
  ) then
    insert into public.matches (couple_id, kind, item_id, payload, source, added_by)
    values (new.couple_id, new.kind, new.item_id, new.payload, 'match', null)
    on conflict (couple_id, kind, item_id) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_swipe_match() from public, anon, authenticated;

create trigger swipes_match
  after insert or update of liked on public.swipes
  for each row execute function public.handle_swipe_match();

-- Notes croisées : une note par personne et par élément vu
create table public.ratings (
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  comment text check (char_length(comment) <= 500),
  updated_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.ratings enable row level security;
create policy "ratings : lecture couple" on public.ratings for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "ratings : ajout des miennes" on public.ratings for insert to authenticated
  with check (
    user_id = auth.uid()
    and couple_id = public.my_couple_id()
    and exists (select 1 from public.matches m where m.id = match_id and m.couple_id = public.my_couple_id())
  );
create policy "ratings : modif des miennes" on public.ratings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "ratings : suppression des miennes" on public.ratings for delete to authenticated
  using (user_id = auth.uid());
-- On ne déplace pas une note vers un autre film : seules la note et le commentaire changent
revoke update on public.ratings from authenticated;
grant update (stars, comment, updated_at) on public.ratings to authenticated;

-- Temps réel : les matchs et les notes apparaissent chez l'autre sans recharger
alter publication supabase_realtime add table public.matches, public.ratings;
