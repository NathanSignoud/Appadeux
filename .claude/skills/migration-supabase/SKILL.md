---
name: migration-supabase
description: Écrire, nommer et appliquer une migration SQL Supabase pour l'app Nous, avec les politiques RLS obligatoires. À utiliser dès qu'on crée ou modifie une table, une fonction SQL, un bucket Storage ou une publication Realtime.
---

# Migration Supabase

## 1. Créer le fichier

- Emplacement : `supabase/migrations/AAAAMMJJHHMMSS_description_courte.sql` (horodatage UTC, snake_case).
  Exemple : `20261120143000_swipes.sql`. Ou bien `npx supabase migration new swipes`.
- **Ne jamais modifier une migration déjà appliquée** : on en crée une nouvelle.
- Une migration = un sujet (une feature). Commentaires en français pour le pourquoi.

## 2. Modèle pour toute nouvelle table métier

```sql
create table public.ma_table (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
  -- colonnes métier : montants en centimes (integer), dates en timestamptz
);
create index ma_table_couple_id_idx on public.ma_table (couple_id);

alter table public.ma_table enable row level security;

create policy "ma_table : lecture couple" on public.ma_table for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "ma_table : ajout couple" on public.ma_table for insert to authenticated
  with check (couple_id = public.my_couple_id() and created_by = auth.uid());
create policy "ma_table : modif couple" on public.ma_table for update to authenticated
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "ma_table : suppression couple" on public.ma_table for delete to authenticated
  using (couple_id = public.my_couple_id());

-- si l'autre doit voir les changements en direct :
alter publication supabase_realtime add table public.ma_table;
```

## 3. Règles RLS obligatoires

- [ ] `enable row level security` sur **chaque** table, sans exception.
- [ ] Chaque politique est `to authenticated` et filtre sur `couple_id = public.my_couple_id()`.
- [ ] Élément secret (liste cadeaux…) : ajouter `and owner_id = auth.uid()` dans **using** de select/update/delete et dans **with check**. L'UI ne suffit jamais.
- [ ] Le `with check` empêche de déplacer une ligne vers un autre couple.
- [ ] Fonction `security definer` : toujours `set search_path = ''`, noms qualifiés (`public.x`), vérifier `auth.uid()`, puis `revoke execute ... from public, anon` et `grant execute ... to authenticated`.
- [ ] Colonnes qu'on ne doit pas modifier : `revoke update` sur la table puis `grant update (col1, col2)`.
- [ ] Storage : bucket `public = false`, politiques sur `storage.objects` qui vérifient que le premier dossier du chemin vaut `my_couple_id()::text`.

## 4. Appliquer

```bash
npx supabase db push --remote            # applique les migrations en attente sur le projet distant
npx supabase gen types typescript --remote > src/lib/database.types.ts
npm run build                   # les types générés doivent compiler
```

## 5. Vérifier la RLS

Écrire un test dans `supabase/tests/<sujet>.sql`, toujours entre `begin;` et `rollback;` (rien n'est enregistré, le Realtime ne diffuse rien). Modèle : `supabase/tests/cine_match.sql`.

- Se faire passer pour chacun des deux membres : `set local role authenticated;` puis
  `select set_config('request.jwt.claims', json_build_object('sub', '<uuid>', 'role', 'authenticated')::text, true);`
- Stocker les résultats intermédiaires avec `set_config('t.x', …, true)` et les afficher dans un `select` final avec la valeur attendue dans le nom de colonne.
- Tester aussi ce qui **doit échouer** (fichier séparé, l'erreur annule la transaction) : modifier une ligne de l'autre couple, lire un secret de l'autre, fabriquer une ligne réservée à un trigger.

```bash
npx supabase db query --remote --yes -f supabase/tests/<sujet>.sql
```

Puis mettre à jour le schéma dans `CLAUDE.md`.
