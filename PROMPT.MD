# Prompt de départ — « Nous », l'app de couple (ciné, calendrier, listes, dépenses, alphabet des dates)

## Contexte

Je veux construire une **web app privée pour mon couple** : un site installable sur l'écran d'accueil de nos téléphones (PWA), utilisé uniquement par nous deux. L'interface est **en français**, pensée **mobile d'abord**.

- Nom de l'app : **Nous**
- Nos prénoms : Nathan et Lou
- Hébergement : **Cloudflare** (offre gratuite). Je débute en hébergement : explique-moi chaque étape simplement. Utilise la méthode que Cloudflare recommande actuellement pour un nouveau projet (Workers avec static assets ; Pages si c'est plus simple), avec le dépôt GitHub connecté pour que chaque `git push` sur `main` redéploie automatiquement. Configure le fallback SPA (toutes les routes renvoient vers `index.html`) et les variables d'environnement côté Cloudflare.

Travaille **phase par phase** (voir plus bas). À la fin de chaque phase : vérifie que tout marche, fais un commit, résume ce qui a été fait, et **attends ma validation** avant de passer à la suivante. Si une décision importante n'est pas tranchée ici, pose-moi la question au lieu de deviner.

---

## Skills et organisation du projet

1. **Avant d'écrire la moindre UI**, si la skill `frontend-design` est disponible, charge-la et utilise-la pour définir une direction visuelle forte et cohérente (pas un template générique). Propose-moi la direction (palette, typo, ambiance) en quelques lignes avant de coder les écrans.
2. **Crée un `CLAUDE.md`** à la racine dès la phase 0, avec : la stack, l'arborescence, les conventions (nommage, composants, gestion d'état), le schéma de base de données, les commandes utiles, et les règles de sécurité ci-dessous. Mets-le à jour à chaque phase.
3. **Crée des skills de projet** dans `.claude/skills/` pour les tâches qui reviennent souvent, chacune avec un `SKILL.md` clair :
   - `nouvelle-fonctionnalite` : la checklist complète pour ajouter une feature (migration SQL → politiques RLS → types TypeScript générés → hooks de données → UI → test manuel sur mobile → mise à jour du CLAUDE.md).
   - `migration-supabase` : comment écrire, nommer et appliquer une migration, avec les politiques RLS obligatoires pour toute nouvelle table.
   - `moteur-swipe` : comment brancher une nouvelle source de cartes sur le moteur de swipe générique (pour pouvoir plus tard swiper des restos, des recettes, etc.).
   - `deploiement` : les étapes pour builder et déployer, et vérifier que la PWA s'installe bien.
4. Utilise ces skills toi-même au fil des phases, et améliore-les si tu constates qu'il manque une étape.

---

## Stack technique

- **Front** : Vite + React + TypeScript + Tailwind CSS, router côté client.
- **PWA** : `vite-plugin-pwa` (manifest, icônes, service worker, installable sur iOS et Android).
- **Back** : **Supabase**
  - Auth (email + mot de passe ou lien magique)
  - Postgres avec **Row Level Security** sur toutes les tables
  - Realtime (les swipes, listes et événements doivent se mettre à jour en direct chez l'autre)
  - Storage pour les photos (alphabet des dates)
  - Edge Functions pour appeler l'API TMDB sans exposer la clé
- **Films et séries** : API **TMDB** (affiches, résumés, durée, genres, pays de production, année, plateformes disponibles en France via les « watch providers », région `FR`, langue `fr-FR`).

---

## Sécurité (non négociable)

- Le site a une URL publique : **tout est derrière une connexion**.
- Une table `couples` relie exactement deux utilisateurs. Le premier crée le couple, le second le rejoint avec un **code d'invitation**. Ensuite, plus personne ne peut rejoindre.
- **RLS partout** : un utilisateur ne voit que les données de son couple. Les éléments « secrets » (liste cadeaux) ne sont visibles que par leur auteur.
- Aucune clé secrète dans le front ni dans Git : `.env` dans `.gitignore`, un `.env.example` documenté, la clé TMDB uniquement côté Edge Function.
- Photos dans un bucket **privé**, servies par URLs signées.

---

## Fonctionnalités

### 1. Ciné 🎬

- **Swipe à deux** : chacun swipe des films de son côté (droite = envie, gauche = non). Quand les deux ont swipé à droite le même film → écran « Match ! » et le film part dans les matchs. Le moteur de swipe doit être **générique** (une interface `SwipeSource`) pour pouvoir réutiliser le même composant sur d'autres types de cartes plus tard.
- **Filtres du soir** : durée max, genres, plateformes (nos abonnements, réglables dans les paramètres), humeur (léger / frissons / émotion / action / réflexion → mappés sur des genres TMDB).
- **Roulette** : tirage au sort animé parmi les matchs.
- **Joker veto** : chacun a 1 veto par semaine pour retirer un match. Compteur visible, remise à zéro chaque lundi.
- **Watchlist commune** : les matchs + ajouts manuels (recherche TMDB). Bouton « Vu » qui ouvre la notation.
- **Séries en cours** : on suit où on en est (saison/épisode). **Compteur de trahisons** : si l'un avance seul, il le déclare (ou l'autre le signale) et le compteur augmente, avec un petit historique moqueur.
- **Notes croisées** : chacun note sur 5 (+ commentaire optionnel). Affichage côte à côte et **taux d'accord** global du couple.
- **Wrapped ciné** : récap annuel façon stories (films vus, heures passées, genre favori, plus gros désaccord, film le mieux noté par les deux, nombre de trahisons…).

### 2. Passeport ciné 🌍

- **Carte du monde** qui se colore selon les pays de production des films vus ensemble.
- **Frise des décennies** (1920s → 2020s) qui se remplit de la même façon.
- **Badges** à débloquer, par exemple : un film par continent, 5 décennies différentes, une trilogie complète, 10 films non anglophones, un film de plus de 3 h, un film muet… (prévois un système de badges facile à étendre).
- **Suggestions** : « Pour compléter votre passeport, essayez… » (films bien notés d'un pays ou d'une décennie qui nous manque), avec un bouton pour les envoyer dans le swipe.

### 3. Calendrier commun 📅

- Chacun peut créer un événement : titre, date/heure de début et de fin (ou journée entière), lieu optionnel, note, et surtout un type :
  - **À deux** (on y va ensemble)
  - **Solo** (je fais ça de mon côté)
  - **Absence** (je ne suis pas là, sur une ou plusieurs journées : déplacement, week-end entre potes…)
- Les absences s'affichent comme des **bandeaux** sur les jours concernés, avec la couleur de la personne absente, et un rappel sur l'accueil (« [PRÉNOM] est absent·e jusqu'à jeudi »).
- Vues : **mois** et **liste « à venir »**. Code couleur par personne + style différent pour « à deux ».
- **Comptes à rebours** : n'importe quel événement peut être épinglé en compte à rebours sur la page d'accueil (« J-12 avant Rome »).

### 4. Listes partagées 📝

- Plusieurs listes (courses, à faire, envies, etc.), éléments cochables, réordonnables, modifiables par les deux **en temps réel**.
- **Liste cadeaux secrète** : chaque personne a la sienne, invisible pour l'autre (garanti par RLS, pas seulement masqué dans l'UI).

### 5. Dépenses communes 💶

- Ajouter une dépense : montant, libellé, catégorie, date, qui a payé, répartition (50/50 par défaut, ou personnalisée en % ou en montant).
- **Solde** clair : « [PRÉNOM] doit X € à [PRÉNOM] ». Bouton « On est quittes » qui enregistre un remboursement.
- Historique filtrable et petit récap par catégorie et par mois.

### 6. Alphabet des dates 🔤

- Une page avec les **26 lettres** en grille. On fait chacun notre tour un date dont le thème commence par la lettre (A, puis B, etc.).
- Chaque lettre a un état : à faire / planifiée / faite. Une lettre faite est visuellement « remplie » (sa photo de couverture en fond, par exemple).
- Dans le détail d'une lettre : qui l'a organisé (alternance proposée par défaut, modifiable), le thème/titre (« B comme Bowling »), la date, une description, et **plusieurs photos** (upload depuis le téléphone, compression côté client avant envoi).
- Possibilité de planifier une lettre en créant directement l'événement « À deux » dans le calendrier.
- Une banque d'idées optionnelle par lettre (quelques suggestions pour se lancer).
- Barre de progression « 12/26 » et un petit écran de fête quand on termine Z.

### Page d'accueil

Un tableau de bord simple : compte à rebours épinglé, prochain événement, absence en cours éventuelle, nouveaux matchs, solde des dépenses, progression de l'alphabet. Navigation par barre d'onglets en bas (Accueil, Ciné, Calendrier, Listes, Plus → Dépenses, Alphabet, Passeport, Paramètres).

---

## Phases

- **Phase 0 — Fondations** : init du projet, Tailwind, PWA, Supabase (auth, table `couples`, code d'invitation, RLS), layout mobile avec barre d'onglets, `CLAUDE.md`, skills de projet, direction visuelle validée avec moi.
- **Phase 1 — Ciné (cœur)** : Edge Function TMDB, moteur de swipe générique, swipe à deux + match en temps réel, filtres, watchlist, notation.
- **Phase 2 — Calendrier** : événements à deux / solo / absence, vues mois + liste, comptes à rebours épinglés, page d'accueil.
- **Phase 3 — Listes et dépenses** : listes temps réel, liste cadeaux secrète, dépenses, soldes.
- **Phase 4 — Alphabet des dates et passeport ciné** : grille A→Z avec photos (Storage), lien avec le calendrier, carte du monde, frise, badges, suggestions.
- **Phase 5 — Finitions** : roulette, veto, séries en cours + compteur de trahisons, taux d'accord, Wrapped, états vides soignés, animations, mode sombre, déploiement final.

---

## Ce que j'attends de toi au démarrage

1. Lis tout ce prompt, puis donne-moi en une dizaine de lignes : ton plan, le schéma de base de données envisagé (tables principales), et la liste de ce que je dois préparer de mon côté (compte Supabase, clé API TMDB, etc.), avec les étapes pour les obtenir.
2. Pose-moi tes questions s'il y en a.
3. Attends mon feu vert, puis attaque la **phase 0**.