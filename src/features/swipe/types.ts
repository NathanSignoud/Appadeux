import type { ReactNode } from 'react'
import type { Json } from '../../lib/database.types'

/** Ce qu'une source de cartes doit fournir au moteur de swipe (voir la skill moteur-swipe). */
export interface SwipeSource<T> {
  /** Type d'élément, stocké dans swipes.kind et matches.kind : 'movie', 'restaurant'… */
  kind: string
  /** Change quand les filtres changent : le paquet repart de zéro. */
  key: string
  /** Page n (à partir de 1). hasMore = false quand il n'y a plus rien à charger. */
  fetchPage(page: number): Promise<{ items: T[]; hasMore: boolean }>
  getId(item: T): string
  /** Instantané stocké avec le swipe, recopié dans le match. */
  toPayload(item: T): Json
  fromPayload(payload: Json): T
  renderCard(item: T): ReactNode
  /** Titre et image pour l'écran « Match ! ». */
  describe(item: T): { title: string; image: string | null }
}
