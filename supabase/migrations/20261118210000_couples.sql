-- Fondations : un couple = exactement deux membres.
-- Le premier crée le couple (create_couple), le second le rejoint avec le code (join_couple).
-- Le code est détruit dès que le second membre arrive : plus personne ne peut rejoindre.

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique, -- null une fois le couple complet
  created_at timestamptz not null default now()
);

create table public.members (
  user_id uuid primary key references auth.users (id) on delete cascade, -- PK : un seul couple par personne
  couple_id uuid not null references public.couples (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  joined_at timestamptz not null default now()
);
create index members_couple_id_idx on public.members (couple_id);

-- Couple de l'utilisateur connecté. SECURITY DEFINER pour lire members sans boucler sur sa propre RLS.
-- Toutes les politiques RLS du projet s'appuient sur cette fonction.
create function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select couple_id from public.members where user_id = auth.uid()
$$;

-- 8 caractères sans ambiguïté (pas de 0/O, 1/I) tirés d'octets aléatoires sûrs.
-- 256 est un multiple de 32 : le modulo ne biaise pas le tirage.
create function public.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', get_byte(r.b, i) % 32 + 1, 1), '' order by i)
  from (select extensions.gen_random_bytes(8) as b) r, generate_series(0, 7) as i
$$;

create function public.create_couple(p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'already_in_couple';
  end if;

  insert into public.couples (invite_code) values (public.generate_invite_code())
  returning id into v_couple_id;

  insert into public.members (user_id, couple_id, display_name)
  values (auth.uid(), v_couple_id, trim(p_display_name));

  return v_couple_id;
end;
$$;

create function public.join_couple(p_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'already_in_couple';
  end if;

  -- FOR UPDATE : deux personnes qui rejoignent en même temps passent l'une après l'autre
  select id into v_couple_id
  from public.couples
  where invite_code = upper(trim(p_code))
  for update;

  if v_couple_id is null then
    raise exception 'invalid_code';
  end if;
  if (select count(*) from public.members where couple_id = v_couple_id) >= 2 then
    raise exception 'couple_full';
  end if;

  insert into public.members (user_id, couple_id, display_name)
  values (auth.uid(), v_couple_id, trim(p_display_name));

  update public.couples set invite_code = null where id = v_couple_id;

  return v_couple_id;
end;
$$;

-- Droits : seules les personnes connectées appellent ces fonctions
revoke execute on function public.my_couple_id() from public, anon;
revoke execute on function public.generate_invite_code() from public, anon, authenticated;
revoke execute on function public.create_couple(text) from public, anon;
revoke execute on function public.join_couple(text, text) from public, anon;
grant execute on function public.my_couple_id() to authenticated;
grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text, text) to authenticated;

-- RLS : on ne voit que son couple. Création et adhésion passent uniquement par les fonctions ci-dessus.
alter table public.couples enable row level security;
alter table public.members enable row level security;

create policy "couples : lecture de mon couple"
  on public.couples for select to authenticated
  using (id = public.my_couple_id());

create policy "members : lecture des membres de mon couple"
  on public.members for select to authenticated
  using (couple_id = public.my_couple_id());

create policy "members : je modifie ma propre ligne"
  on public.members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Le prénom est la seule colonne modifiable : impossible de changer de couple par un UPDATE
revoke insert, update, delete on public.couples from anon, authenticated;
revoke insert, update, delete on public.members from anon, authenticated;
grant update (display_name) on public.members to authenticated;

-- Temps réel : le premier membre voit le second arriver sans recharger
alter publication supabase_realtime add table public.members;
