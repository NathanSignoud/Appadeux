import { imageUrl, MOODS, tmdb, type Movie } from '../../lib/tmdb'
import type { SwipeSource } from '../swipe/types'
import type { CineFilters } from './filters'
import { MovieCard } from './MovieCard'

/** Films TMDB branchés sur le moteur de swipe générique. */
export function movieSource(filters: CineFilters, ourProviders: number[]): SwipeSource<Movie> {
  const mood = MOODS.find((m) => m.id === filters.mood)
  const genres = [...new Set([...filters.genres, ...(mood?.genres ?? [])])]
  const providers = filters.onlyOurs ? ourProviders : []

  return {
    kind: 'movie',
    key: JSON.stringify({ genres, maxRuntime: filters.maxRuntime, providers }),
    async fetchPage(page) {
      const { movies, totalPages } = await tmdb.discover({ page, genres, maxRuntime: filters.maxRuntime, providers })
      return { items: movies, hasMore: page < totalPages }
    },
    getId: (m) => String(m.id),
    toPayload: (m) => m,
    fromPayload: (p) => p as unknown as Movie,
    renderCard: (m) => <MovieCard movie={m} />,
    describe: (m) => ({ title: m.title, image: imageUrl(m.posterPath, 'w342') }),
  }
}
