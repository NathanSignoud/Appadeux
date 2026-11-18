# Nous — l'app de couple de Nathan et Lou

Web app privée (PWA) pour deux personnes : ciné à deux, calendrier, listes, dépenses, alphabet des dates.
Interface **en français**, **mobile d'abord**. Cahier des charges complet : [PROMPT.MD](PROMPT.MD).

## Stack

- Vite + React 19 + TypeScript + Tailwind CSS v4 (plugin `@tailwindcss/vite`, pas de `tailwind.config`)
- Routeur : `react-router` (mode déclaratif, `<BrowserRouter>`)
- PWA : `vite-plugin-pwa` (manifest + service worker + icônes générées depuis `public/logo.svg`)
- Back : Supabase (Auth email + mot de passe, Postgres + RLS, Realtime, Storage, Edge Functions)
- Films : API TMDB, appelée **uniquement** depuis une Edge Function (région `FR`, langue `fr-FR`)
- Hébergement : Cloudflare Workers (static assets), déploiement auto à chaque push sur `main`

## Arborescence

```
src/
  main.tsx            point d'entrée
  App.tsx             routes + garde d'accès (connexion → couple → app)
  index.css           Tailwind + tokens de design (@theme)
  lib/
    supabase.ts       client Supabase typé
    database.types.ts types GÉNÉRÉS (ne pas éditer à la main)
    auth.tsx          AuthProvider / useAuth : session, moi, l'autre, couple
  components/         UI partagée (ui.tsx, TabBar, Layout, Soon = page provisoire)
  features/<nom>/     une fonctionnalité = ses pages + ses hooks de données
                      (auth/Connexion, couple/Bienvenue, accueil/Accueil, plus/Plus + Parametres)
public/logo.svg       source des icônes PWA (réglages : pwa-assets.config.ts)
supabase/
  migrations/         SQL versionné (voir skill migration-supabase)
  functions/          Edge Functions (Deno)
.claude/skills/       checklists du projet
wrangler.jsonc        config Cloudflare (fallback SPA)
```

## Conventions

- **Langue** : texte d'interface en français ; identifiants de code, tables et colonnes en anglais ; routes en français (`/cine`, `/calendrier`, `/listes`, `/plus`).
- **Composants** : un composant par fichier, `PascalCase.tsx`, fonctions (pas de classes). Hooks `useXxx` dans `features/<nom>/hooks.ts`.
- **État** : pas de librairie d'état. Le contexte `useAuth()` porte la session et le couple ; chaque feature lit Supabase dans ses hooks et s'abonne au Realtime pour rester à jour chez l'autre.
- **Données** : montants en **centimes** (`integer`), dates en `timestamptz`, ids `uuid`. Toute table métier a une colonne `couple_id`.
- **Couleurs par personne** : déterminées par l'ordre d'arrivée dans le couple (créateur = personne A, second = personne B), pas stockées en base.
- **Erreurs SQL** : les fonctions lèvent des codes courts (`invalid_code`, `couple_full`…) que le front traduit en français.

## Schéma de base de données

| Table | Rôle | RLS |
|---|---|---|
| `couples` | `id`, `invite_code` (null une fois complet) | lecture : mon couple |
| `members` | `user_id` (PK → un seul couple), `couple_id`, `display_name` | lecture : mon couple ; update de `display_name` sur ma ligne |

Fonctions : `my_couple_id()` (base de toutes les politiques), `create_couple(nom)`, `join_couple(code, nom)`.
Aucun INSERT/DELETE direct sur ces tables : tout passe par les fonctions.

Tables prévues dans les phases suivantes : `media`, `swipes`, `watchlist`, `ratings`, `vetoes`, `shows_progress`, `betrayals` (ciné) ; `events` ; `lists`, `list_items` ; `expenses`, `settlements` ; `alphabet_letters`, `alphabet_photos`.

## Sécurité (non négociable)

- Tout est derrière une connexion. Les inscriptions Supabase sont **fermées** une fois les deux comptes créés.
- **RLS activée sur chaque table**, politiques basées sur `couple_id = my_couple_id()`. Les éléments secrets (liste cadeaux) sont filtrés aussi sur `auth.uid()` **dans la politique**, pas seulement dans l'UI.
- Aucune clé secrète dans le front ni dans Git. Seules `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` vont dans le front. Le jeton TMDB est un secret d'Edge Function. Ces deux valeurs publiques sont versionnées dans `.env.production` ; les vraies clés secrètes ne vont jamais dans un fichier `.env.*` versionné.
- Photos dans un bucket **privé**, servies par URLs signées.

## Commandes utiles

```bash
npm run dev                                   # serveur local (http://localhost:5173)
npm run build                                 # vérif TypeScript + build dans dist/
npm run preview                               # sert le build (pour tester la PWA)
npx supabase link --project-ref <ref>         # relier le dossier au projet Supabase (une fois)
npx supabase db push --remote                          # appliquer les migrations sur le projet distant
npx supabase gen types typescript --remote > src/lib/database.types.ts
npx supabase functions deploy <nom> --use-api # déployer une Edge Function sans Docker
npx wrangler deploy                           # déploiement manuel (normalement : git push)
```

## Skills du projet

- `nouvelle-fonctionnalite` : checklist complète d'une feature
- `migration-supabase` : écrire et appliquer une migration + RLS
- `moteur-swipe` : brancher une nouvelle source de cartes
- `deploiement` : builder, déployer, vérifier la PWA

## Décisions prises

- Connexion par email + mot de passe (un lien magique s'ouvrirait dans Safari, hors de la PWA sur iOS).
- Alphabet des dates : le créateur du couple organise la lettre A, puis alternance.
- URL : Worker `appadeux` sur le sous-domaine gratuit `workers.dev` pour commencer ; domaine perso possible plus tard sans changer le code.

## Direction visuelle — « Guimauve » (80 %) + « Riso » (20 %)

Validée le 18/11/2026. Objectif : **cosy et très agréable à utiliser**. Maquettes de référence : https://claude.ai/artifact/Gmv9fjGACwGBXiWVhxnc2C (pistes 5 et 1).

- **Ambiance** : douce, ronde, ludique. Fond lilas, aplats pastel, formes « guimauve » jamais parfaitement régulières (`.blob`, `.blob-alt`, coins asymétriques `rounded-[28px_28px_28px_10px]`).
- **Couleurs** (tokens Tailwind dans `src/index.css`) : `lilas` fond, `lilas-fonce`, `prune` texte, `prune-doux` texte secondaire, `peche`, `menthe`, `beurre`, `violet`, `erreur`.
- **Touche riso** : chaque personne a son encre, `encre-a` (bleu, créateur du couple) et `encre-b` (rose). Ce qui se vit **à deux** est imprimé avec les deux encres superposées (`<Overprint>`, `mix-blend-multiply`). À utiliser avec parcimonie : un seul élément riso par écran. Encres = aplats et formes, jamais du texte.
- **Typo** : Fredoka (variable, auto-hébergée via `@fontsource-variable/fredoka`), une seule famille. Titres `font-bold`, texte `font-medium`. Champs en `text-lg` minimum (pas de zoom iOS).
- **Composants** : `src/components/ui.tsx` (`Button` primaire prune ou `soft` blanc, `Field`, `Message`, `Avatar`, `Overprint`). Barre d'onglets en pilule blanche flottante.
- **Règles** : zones tactiles ≥ 44 px (`min-h-12`), pas d'emoji dans l'UI (icônes SVG au trait), mouvement seulement en réponse à un geste (`active:scale-[0.97]`), `prefers-reduced-motion` respecté.
