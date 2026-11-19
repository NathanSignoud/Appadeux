-- Phase 3 — Listes partagées (temps réel) et listes secrètes (idées cadeaux).
-- owner_id null = liste du couple ; owner_id = quelqu'un = liste secrète, visible par cette personne SEULEMENT (RLS).

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  owner_id uuid references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 60),
  created_at timestamptz not null default now(),
  check (owner_id is null or owner_id = created_by)
);
create index lists_couple_id_idx on public.lists (couple_id);

alter table public.lists enable row level security;
-- Une liste secrète est filtrée DANS la politique : l'autre ne peut ni la lire, ni la modifier, ni la supprimer.
create policy "lists : lecture" on public.lists for select to authenticated
  using (couple_id = public.my_couple_id() and (owner_id is null or owner_id = auth.uid()));
create policy "lists : ajout" on public.lists for insert to authenticated
  with check (couple_id = public.my_couple_id() and created_by = auth.uid() and (owner_id is null or owner_id = auth.uid()));
create policy "lists : modif" on public.lists for update to authenticated
  using (couple_id = public.my_couple_id() and (owner_id is null or owner_id = auth.uid()))
  with check (couple_id = public.my_couple_id());
create policy "lists : suppression" on public.lists for delete to authenticated
  using (couple_id = public.my_couple_id() and (owner_id is null or owner_id = auth.uid()));
-- On renomme une liste, rien d'autre : une liste partagée ne peut pas devenir secrète (ni l'inverse).
revoke update on public.lists from authenticated;
grant update (title) on public.lists to authenticated;

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (char_length(trim(text)) between 1 and 200),
  done boolean not null default false,
  -- ordre manuel : un nouvel élément va à la fin ; déplacer = prendre le milieu de ses deux voisins
  position double precision not null default extract(epoch from clock_timestamp()),
  created_at timestamptz not null default now()
);
create index list_items_list_id_idx on public.list_items (list_id);

alter table public.list_items enable row level security;
-- Un élément suit sa liste : visible et modifiable seulement si la liste l'est (même règle secrète).
create policy "list_items : lecture" on public.list_items for select to authenticated
  using (exists (select 1 from public.lists l where l.id = list_id
    and l.couple_id = public.my_couple_id() and (l.owner_id is null or l.owner_id = auth.uid())));
create policy "list_items : ajout" on public.list_items for insert to authenticated
  with check (created_by = auth.uid() and exists (select 1 from public.lists l where l.id = list_id
    and l.couple_id = public.my_couple_id() and (l.owner_id is null or l.owner_id = auth.uid())));
create policy "list_items : modif" on public.list_items for update to authenticated
  using (exists (select 1 from public.lists l where l.id = list_id
    and l.couple_id = public.my_couple_id() and (l.owner_id is null or l.owner_id = auth.uid())));
create policy "list_items : suppression" on public.list_items for delete to authenticated
  using (exists (select 1 from public.lists l where l.id = list_id
    and l.couple_id = public.my_couple_id() and (l.owner_id is null or l.owner_id = auth.uid())));
revoke update on public.list_items from authenticated;
grant update (text, done, position) on public.list_items to authenticated;

-- Le Realtime applique la politique de lecture à chaque abonné : l'autre ne reçoit pas les lignes secrètes.
alter publication supabase_realtime add table public.lists, public.list_items;
