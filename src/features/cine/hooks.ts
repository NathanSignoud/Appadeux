import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import type { Movie } from '../../lib/tmdb'
import { useLiveQuery } from '../../lib/useLiveQuery'

export type MovieMatch = Tables<'matches'> & { movie: Movie }
export type Rating = Tables<'ratings'>

/** Watchlist + films vus du couple, à jour en direct. */
export function useMovieMatches() {
  const q = useLiveQuery(['matches'], () => supabase.from('matches').select('*').eq('kind', 'movie').order('created_at', { ascending: false }))
  return { ...q, data: q.data.map((m): MovieMatch => ({ ...m, movie: m.payload as unknown as Movie })) }
}

export function useRatings() {
  return useLiveQuery(['ratings'], () => supabase.from('ratings').select('*'))
}
