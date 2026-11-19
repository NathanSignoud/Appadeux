-- Phase 4 — Alphabet des dates : 26 lettres, une ligne créée au premier enregistrement d'une lettre.
-- Photos dans le bucket PRIVÉ « alphabet », chemin = <couple_id>/<letter_id>/<uuid>.jpg, servies par URLs signées.

create table public.alphabet_letters (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  letter text not null check (letter ~ '^[A-Z]$'),
  status text not null default 'todo' check (status in ('todo', 'planned', 'done')),
  organizer_id uuid references auth.users (id) on delete set null, -- null = alternance par défaut (A = créateur du couple)
  title text check (char_length(title) <= 80), -- le thème : « Bowling » pour « B comme Bowling »
  description text check (char_length(description) <= 2000),
  date_on date,
  event_id uuid references public.events (id) on delete set null, -- l'événement « À deux » créé depuis la lettre
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, letter)
);

alter table public.alphabet_letters enable row level security;
-- Organisateur = un des deux ; événement lié = un événement du couple
create policy "alphabet_letters : lecture couple" on public.alphabet_letters for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "alphabet_letters : ajout couple" on public.alphabet_letters for insert to authenticated
  with check (couple_id = public.my_couple_id()
    and (organizer_id is null or exists (select 1 from public.members m where m.user_id = organizer_id and m.couple_id = public.my_couple_id()))
    and (event_id is null or exists (select 1 from public.events e where e.id = event_id and e.couple_id = public.my_couple_id())));
create policy "alphabet_letters : modif couple" on public.alphabet_letters for update to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id()
    and (organizer_id is null or exists (select 1 from public.members m where m.user_id = organizer_id and m.couple_id = public.my_couple_id()))
    and (event_id is null or exists (select 1 from public.events e where e.id = event_id and e.couple_id = public.my_couple_id())));
revoke update, delete on public.alphabet_letters from authenticated;
grant update (status, organizer_id, title, description, date_on, event_id, updated_at) on public.alphabet_letters to authenticated;

create table public.alphabet_photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  letter_id uuid not null references public.alphabet_letters (id) on delete cascade,
  path text not null unique,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index alphabet_photos_letter_id_idx on public.alphabet_photos (letter_id);

alter table public.alphabet_photos enable row level security;
create policy "alphabet_photos : lecture couple" on public.alphabet_photos for select to authenticated
  using (couple_id = public.my_couple_id());
-- Le chemin doit être rangé dans le dossier du couple et de la lettre
create policy "alphabet_photos : ajout couple" on public.alphabet_photos for insert to authenticated
  with check (couple_id = public.my_couple_id() and created_by = auth.uid()
    and exists (select 1 from public.alphabet_letters l where l.id = letter_id and l.couple_id = public.my_couple_id())
    and path like public.my_couple_id()::text || '/' || letter_id::text || '/%');
create policy "alphabet_photos : suppression couple" on public.alphabet_photos for delete to authenticated
  using (couple_id = public.my_couple_id());
revoke update on public.alphabet_photos from authenticated;

alter publication supabase_realtime add table public.alphabet_letters, public.alphabet_photos;

-- Bucket privé : 5 Mo max par photo (elles sont compressées avant envoi), images seulement
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('alphabet', 'alphabet', false, 5242880, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Premier dossier du chemin = mon couple : l'autre couple (s'il en existait un) ne peut ni lire, ni écrire, ni supprimer
create policy "alphabet : lecture couple" on storage.objects for select to authenticated
  using (bucket_id = 'alphabet' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy "alphabet : envoi couple" on storage.objects for insert to authenticated
  with check (bucket_id = 'alphabet' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy "alphabet : suppression couple" on storage.objects for delete to authenticated
  using (bucket_id = 'alphabet' and (storage.foldername(name))[1] = public.my_couple_id()::text);
