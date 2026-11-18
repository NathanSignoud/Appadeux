---
name: moteur-swipe
description: Brancher une nouvelle source de cartes (films, restos, recettes…) sur le moteur de swipe générique de l'app Nous via l'interface SwipeSource. À utiliser quand on veut swiper un nouveau type d'élément à deux.
---

# Moteur de swipe

> Le moteur est construit en phase 1. Mettre à jour cette skill avec les vrais chemins et signatures dès qu'il existe.

## Principe

Le composant de swipe ne connaît rien aux films. Il reçoit une `SwipeSource<T>` qui sait :

```ts
interface SwipeSource<T> {
  kind: string                                  // 'movie', 'restaurant'… : stocké dans swipes.kind
  fetchBatch(cursor?: string): Promise<{ items: T[]; next?: string }>
  getId(item: T): string                        // id stable (ex. id TMDB)
  renderCard(item: T): React.ReactNode          // le visuel de la carte
}
```

Le moteur gère : la pile de cartes, les gestes (droite = envie, gauche = non), l'enregistrement dans `swipes` (`kind`, `item_id`, `liked`), le préchargement, et l'écran « Match ! » quand les deux ont dit oui.

## Ajouter une source

1. Créer `src/features/<nom>/source.ts` qui exporte une `SwipeSource<MonType>`.
2. Si les données viennent d'une API à clé : passer par une Edge Function, jamais depuis le front.
3. Choisir un `kind` unique ; les matchs sont détectés en SQL sur `(couple_id, kind, item_id)`.
4. Écrire `renderCard` en respectant la direction visuelle (image plein cadre, infos clés lisibles d'un coup d'œil).
5. Monter le moteur sur une route : `<SwipeDeck source={maSource} onMatch={...} />`.
6. Tester à deux comptes : un match doit apparaître chez les deux en temps réel.
