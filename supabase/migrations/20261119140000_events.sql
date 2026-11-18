-- Phase 2 — Calendrier commun : événements à deux / solo / absence, comptes à rebours épinglés.
-- Journée entière : starts_at = minuit du premier jour, ends_at = minuit du DERNIER jour (inclus), heure de Paris.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade, -- la personne concernée (couleur)
  title text not null check (char_length(trim(title)) between 1 and 120),
  kind text not null check (kind in ('together', 'solo', 'absence')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  location text check (char_length(location) <= 200),
  note text check (char_length(note) <= 1000),
  pinned boolean not null default false, -- compte à rebours sur l'accueil
  created_at timestamptz not null default now(),
  check (ends_at >= starts_at),
  check (kind <> 'absence' or all_day) -- une absence se compte en journées
);
create index events_couple_starts_idx on public.events (couple_id, starts_at);

alter table public.events enable row level security;
-- Calendrier partagé : les deux voient et peuvent corriger tous les événements du couple
create policy "events : lecture couple" on public.events for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "events : ajout couple" on public.events for insert to authenticated
  with check (couple_id = public.my_couple_id() and created_by = auth.uid());
create policy "events : modif couple" on public.events for update to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());
create policy "events : suppression couple" on public.events for delete to authenticated
  using (couple_id = public.my_couple_id());
-- On ne change ni le couple ni l'auteur d'un événement
revoke update on public.events from authenticated;
grant update (title, kind, starts_at, ends_at, all_day, location, note, pinned) on public.events to authenticated;

alter publication supabase_realtime add table public.events;
