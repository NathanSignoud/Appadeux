import { statusOf, useLetters } from '../alphabet/hooks'
import { useLoveNotes } from '../bocal/hooks'
import { useCoupons } from '../bons/hooks'
import { useMovieMatches, useShows } from '../cine/hooks'
import { useBets } from '../paris/hooks'
import { garden, type SourceId } from './garden'

/** Rassemble ce que vous avez vécu ensemble et en déduit l'état de la plante. */
export function useGarden() {
  const { data: matches } = useMovieMatches()
  const { data: letters } = useLetters()
  const { data: shows } = useShows()
  const { data: bets } = useBets()
  const { data: notes } = useLoveNotes()
  const { data: coupons } = useCoupons()

  const films = matches.filter((m) => m.done_at)
  const lettres = letters.filter((l) => statusOf(l) === 'done')
  const series = shows.filter((s) => s.finished)
  const gages = bets.filter((b) => b.honored_at)
  const mots = notes.filter((n) => n.drawn_at)
  const bons = coupons.filter((c) => c.used_at)

  const counts: Record<SourceId, number> = { films: films.length, lettres: lettres.length, series: series.length, gages: gages.length, mots: mots.length, bons: bons.length }
  const dates = [
    ...films.map((m) => m.done_at!),
    ...lettres.map((l) => l.updated_at),
    ...series.map((s) => s.updated_at),
    ...gages.map((b) => b.honored_at!),
    ...mots.map((n) => n.drawn_at!),
    ...bons.map((c) => c.used_at!),
  ].sort()
  const last = dates.length ? new Date(dates[dates.length - 1]) : null
  return { counts, state: garden(counts, last) }
}
