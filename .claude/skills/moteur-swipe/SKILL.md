---
name: moteur-swipe
description: Brancher une nouvelle source de cartes (films, restos, recettes…) sur le moteur de swipe générique de l'app Nous via l'interface SwipeSource. À utiliser quand on veut swiper un nouveau type d'élément à deux.
---

# Moteur de swipe

Le moteur (`src/features/swipe/`) ne connaît rien aux films. Exemple complet à copier : `src/features/cine/movieSource.tsx`.

## Ce que fait le moteur (`SwipeDeck`)

- Charge les pages de la source, en excluant ce que j'ai déjà swipé (`swipes`) et ce qui est déjà dans `matches` pour ce `kind`.
- Gère les gestes (glisser à droite = envie, à gauche = non) et les deux boutons accessibles.
- Enregistre dans `swipes` (`kind`, `item_id`, `liked`, `payload`).
- Le trigger SQL `handle_swipe_match()` crée la ligne `matches` (`source = 'match'`) quand les deux ont dit oui ; le moteur écoute le Realtime et affiche `MatchOverlay` **chez les deux**.
- Repart de zéro quand `source.key` change (filtres).

## L'interface (`src/features/swipe/types.ts`)

```ts
interface SwipeSource<T> {
  kind: string                         // 'movie', 'restaurant'… (^[a-z_]{1,30}$)
  key: string                          // change avec les filtres → nouveau paquet
  fetchPage(page: number): Promise<{ items: T[]; hasMore: boolean }>
  getId(item: T): string               // id stable
  toPayload(item: T): Json             // instantané stocké (< 20 Ko), recopié dans le match
  fromPayload(payload: Json): T
  renderCard(item: T): ReactNode       // carte plein cadre ; les <button> internes restent cliquables
  describe(item: T): { title: string; image: string | null }  // écran « Match ! »
}
```

## Ajouter une source

1. Créer `src/features/<nom>/<nom>Source.tsx` qui retourne une `SwipeSource<MonType>` (le construire dans un `useMemo` sur les filtres).
2. Données venant d'une API à clé : nouvelle opération dans une Edge Function, jamais depuis le front.
3. Mettre dans `toPayload` tout ce dont la liste des matchs aura besoin plus tard (évite de rappeler l'API).
4. Monter le moteur : `<SwipeDeck source={source} empty={<p>…</p>} />`.
5. Afficher les matchs : `useLiveQuery(['matches'], () => supabase.from('matches').select('*').eq('kind', '<kind>'))`.
6. Aucune migration nécessaire : `swipes` et `matches` sont génériques.
7. Tester à deux comptes (ou avec `supabase/tests/cine_match.sql` adapté au nouveau `kind`) : le match apparaît chez les deux.
