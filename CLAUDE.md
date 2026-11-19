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
    auth.tsx          AuthProvider / useAuth : session, moi, l'autre, couple, abonnements
    useLiveQuery.ts   lecture Supabase + rechargement Realtime (pattern de données du projet)
    tmdb.ts           client de l'Edge Function tmdb, type Movie, genres, humeurs
    dates.ts          dates locales (J-n, « jusqu’à jeudi », grille du mois…) — testé par tests/dates.test.ts
  components/         UI partagée (ui.tsx, Sheet, TabBar, Layout, Soon = page provisoire)
  features/<nom>/     une fonctionnalité = ses pages + ses hooks de données
                      (auth/Connexion, couple/Bienvenue, accueil/Accueil, plus/Plus + Parametres)
  features/swipe/     moteur de swipe GÉNÉRIQUE (SwipeDeck, SwipeSource, MatchOverlay)
  features/cine/      Cine (sous-onglets) → CineSwipe, Watchlist, Vus ; movieSource branche les films sur le moteur
  features/calendrier/ Calendrier (sous-onglets, EventSheet partagé via Outlet context) → MonthView, UpcomingView
  features/listes/    Listes (aperçu + listes secrètes) → ListeDetail (cocher, modifier, glisser pour réordonner), ListSheet
  features/depenses/  Depenses (solde + « On est quittes ») → Historique, Recap ; ExpenseSheet ; money.ts = logique d'argent pure (testée)
  features/accueil/   tableau de bord : compte à rebours, absences, prochain événement, nouveaux matchs, solde, choses à faire
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
- **État** : pas de librairie d'état. Le contexte `useAuth()` porte la session et le couple ; chaque feature lit Supabase dans ses hooks via `useLiveQuery(tables, requête)`, qui relit la requête dès qu'une table change (chez moi ou chez l'autre).
- **Panneaux** : `<Sheet>` (dialog natif) pour tout formulaire secondaire ; son contenu est démonté à la fermeture, donc l'état du formulaire repart à zéro à chaque ouverture.
- **Écritures** : pas d'`upsert` sur une table dont certaines colonnes sont verrouillées (`grant update (col)`) : PostgREST mettrait à jour toutes les colonnes envoyées. Faire insert OU update.
- **Données** : montants en **centimes** (`integer`), dates en `timestamptz`, ids `uuid`. Toute table métier a une colonne `couple_id`.
- **Couleurs par personne** : déterminées par l'ordre d'arrivée dans le couple (créateur = personne A, second = personne B), pas stockées en base.
- **Erreurs SQL** : les fonctions lèvent des codes courts (`invalid_code`, `couple_full`…) que le front traduit en français.

## Schéma de base de données

| Table | Rôle | RLS |
|---|---|---|
| `couples` | `id`, `invite_code` (null une fois complet), `streaming_providers int[]` (ids TMDB) | lecture : mon couple ; update de `streaming_providers` |
| `members` | `user_id` (PK → un seul couple), `couple_id`, `display_name` | lecture : mon couple ; update de `display_name` sur ma ligne |
| `swipes` | PK (`user_id`, `kind`, `item_id`), `liked`, `payload jsonb` (instantané de la carte) | **chacun ne voit que les siens** ; insert/update des siens |
| `matches` | `kind`, `item_id` (unique par couple), `payload`, `source` (`match` \| `manual`), `added_by`, `done_at` (= « Vu ») | lecture/suppression couple ; insert seulement `source = 'manual'` ; update seulement `done_at` |
| `ratings` | PK (`match_id`, `user_id`), `stars` 1–5, `comment` | lecture couple ; écriture des siennes ; update seulement `stars`, `comment`, `updated_at` |
| `lists` | `title`, `owner_id` (**null = partagée**, sinon liste secrète de cette personne) | partagée : tout le couple ; secrète : **son propriétaire seulement** (lecture, modif, suppression, filtré dans la politique) ; seul `title` est modifiable |
| `list_items` | `list_id`, `text`, `done`, `position` (double, ordre manuel : milieu des deux voisins ; défaut = horodatage → en fin de liste) | suit la visibilité de sa liste ; update de `text`, `done`, `position` |
| `expenses` | `label`, `amount_cents`, `owed_cents` (part due par celui qui **n'a pas** payé), `category` (liste fixe), `spent_on` (date), `paid_by` | tout le couple ; `paid_by` doit être membre du couple ; `owed_cents ≤ amount_cents` |
| `settlements` | `from_user` a remboursé `amount_cents` à `to_user` (« On est quittes ») | lecture, ajout, suppression (= annuler) par le couple ; pas de modification |
| `events` | `title`, `kind` (`together` | `solo` | `absence`), `starts_at`, `ends_at`, `all_day`, `location`, `note`, `pinned` (compte à rebours), `created_by` = la personne concernée (couleur) | tout le couple lit/modifie/supprime ; insert seulement à son nom ; `couple_id` et `created_by` non modifiables ; une absence est forcément `all_day` |

Fonctions : `my_couple_id()` (base de toutes les politiques), `create_couple(nom)`, `join_couple(code, nom)`, trigger `handle_swipe_match()` (crée le match quand les deux ont dit oui ; seul moyen d'obtenir `source = 'match'`).
Pour les films (`kind = 'movie'`), `payload` = type `Movie` de `src/lib/tmdb.ts` (durée, genres, pays, langue, collection, plateformes FR) : la watchlist, le passeport et le Wrapped le lisent sans rappeler TMDB.
Realtime : `members`, `matches`, `ratings`, `events`, `lists`, `list_items`, `expenses`, `settlements`. Le Realtime applique la politique de lecture à chaque abonné (les lignes secrètes ne partent pas chez l'autre) ; seule exception, un DELETE est diffusé à tous avec **uniquement l'id** de la ligne (aucun contenu).
Solde : `balance()` de `src/features/depenses/money.ts` (somme des `owed_cents` ± remboursements), testé par `tests/depenses.test.ts`.
Journée entière : `starts_at` = minuit du premier jour, `ends_at` = minuit du **dernier jour inclus** (heure locale).
Edge Function `tmdb` : opérations `discover`, `search`, `movie`, `providers` ; vérifie la session (JWKS ES256, `verify_jwt = false` dans `config.toml`) ; secret `TMDB_READ_TOKEN`.

Tables prévues dans les phases suivantes : `vetoes`, `shows_progress`, `betrayals` (ciné) ; `alphabet_letters`, `alphabet_photos`.

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
npm test                                      # tests de la logique pure (dates, argent ; Node sans dépendance)
npx supabase link --project-ref <ref>         # relier le dossier au projet Supabase (une fois)
npx supabase db push --remote                          # appliquer les migrations sur le projet distant
npx supabase gen types typescript --remote > src/lib/database.types.ts
npx supabase functions deploy <nom> --use-api --remote # déployer une Edge Function sans Docker
npx supabase db query --remote -f test.sql    # exécuter du SQL (tests RLS dans un begin … rollback)
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
- Liste cadeaux = liste **secrète** (`owner_id`) : chacun peut en avoir plusieurs ; l'app propose « Idées cadeaux pour [l'autre] » si on n'en a pas.
- Dépenses : répartition 50/50 par défaut, ou part de l'autre en % ou en € ; seule la part due est stockée (`owed_cents`). « On est quittes » enregistre un remboursement du solde exact.
- URL : Worker `appadeux` sur le sous-domaine gratuit `workers.dev` pour commencer ; domaine perso possible plus tard sans changer le code.

## Direction visuelle — « Guimauve » (80 %) + « Riso » (20 %)

Validée le 18/11/2026. Objectif : **cosy et très agréable à utiliser**. Maquettes de référence : https://claude.ai/artifact/Gmv9fjGACwGBXiWVhxnc2C (pistes 5 et 1).

- **Ambiance** : douce, ronde, ludique. Fond lilas, aplats pastel, formes « guimauve » jamais parfaitement régulières (`.blob`, `.blob-alt`, coins asymétriques `rounded-[28px_28px_28px_10px]`).
- **Couleurs** (tokens Tailwind dans `src/index.css`) : `lilas` fond, `lilas-fonce`, `prune` texte, `prune-doux` texte secondaire, `peche`, `menthe`, `beurre`, `violet`, `erreur`.
- **Touche riso** : chaque personne a son encre, `encre-a` (bleu, créateur du couple) et `encre-b` (rose). Ce qui se vit **à deux** est imprimé avec les deux encres superposées (`<Overprint>`, `mix-blend-multiply`). À utiliser avec parcimonie : un seul élément riso par écran. Encres = aplats et formes, jamais du texte.
- **Typo** : Fredoka (variable, auto-hébergée via `@fontsource-variable/fredoka`), une seule famille. Titres `font-bold`, texte `font-medium`. Champs en `text-lg` minimum (pas de zoom iOS).
- **Composants** : `src/components/ui.tsx` (`Button` primaire prune ou `soft` blanc, `Field`, `Message`, `Avatar`, `Overprint`). Barre d'onglets en pilule blanche flottante.
- **Règles** : zones tactiles ≥ 44 px (`min-h-12`), pas d'emoji dans l'UI (icônes SVG au trait), mouvement seulement en réponse à un geste (`active:scale-[0.97]`), `prefers-reduced-motion` respecté.
