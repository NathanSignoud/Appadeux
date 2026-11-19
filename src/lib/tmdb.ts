import { supabase } from './supabase'

// Formes renvoyées par l'Edge Function `tmdb` (supabase/functions/tmdb/index.ts)
export type Provider = { id: number; name: string; logoPath: string }
export type Movie = {
  id: number
  title: string
  originalTitle: string
  year: number | null
  runtime: number | null
  overview: string
  posterPath: string | null
  genres: number[]
  countries: string[]
  language: string
  collectionId: number | null
  voteAverage: number
  providers: Provider[]
}
export type SearchResult = { id: number; title: string; year: number | null; posterPath: string | null }

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('tmdb', { body })
  if (error) throw new Error('Les films ne répondent pas pour le moment. Réessaie dans un instant.')
  return data as T
}

/** Série : instantané stocké dans shows.payload. */
export type Show = { id: number; name: string; year: number | null; posterPath: string | null; seasons: { number: number; episodes: number }[]; ended: boolean }

export const tmdb = {
  discover: (p: { page: number; genres: number[]; maxRuntime: number | null; providers: number[]; country?: string | null; decade?: number | null }) =>
    call<{ movies: Movie[]; totalPages: number }>({ op: 'discover', ...p }),
  search: (query: string) => call<{ results: SearchResult[] }>({ op: 'search', query }),
  movie: (id: number) => call<Movie>({ op: 'movie', id }),
  providers: () => call<{ providers: Provider[] }>({ op: 'providers' }),
  searchTv: (query: string) => call<{ results: SearchResult[] }>({ op: 'searchTv', query }),
  tv: (id: number) => call<Show>({ op: 'tv', id }),
}

export const imageUrl = (path: string | null, size: 'w92' | 'w185' | 'w342' | 'w500' = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

// Genres TMDB (ids stables) avec leur nom français
export const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Aventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comédie' },
  { id: 80, name: 'Policier' },
  { id: 99, name: 'Documentaire' },
  { id: 18, name: 'Drame' },
  { id: 10751, name: 'Familial' },
  { id: 14, name: 'Fantastique' },
  { id: 36, name: 'Histoire' },
  { id: 27, name: 'Horreur' },
  { id: 10402, name: 'Musique' },
  { id: 9648, name: 'Mystère' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science-fiction' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'Guerre' },
  { id: 37, name: 'Western' },
]

// Humeurs du soir → genres TMDB (combinés en « OU »)
export const MOODS = [
  { id: 'leger', label: 'Léger', genres: [35, 16, 10751] },
  { id: 'frissons', label: 'Frissons', genres: [27, 53, 9648] },
  { id: 'emotion', label: 'Émotion', genres: [18, 10749] },
  { id: 'action', label: 'Action', genres: [28, 12, 878] },
  { id: 'reflexion', label: 'Réflexion', genres: [99, 36] },
]

export const genreName = (id: number) => GENRES.find((g) => g.id === id)?.name

export const formatRuntime = (minutes: number) => `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`

/** « 2019 · 2 h 12 · Drame » */
export const movieMeta = (m: Movie) =>
  [m.year, m.runtime ? formatRuntime(m.runtime) : null, m.genres.slice(0, 2).map(genreName).filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ')
