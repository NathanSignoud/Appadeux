// Calculs ciné purs, testés (tests/cine.test.ts) : taux d'accord, épisode suivant, Wrapped.

type RatingLike = { match_id: string; user_id: string; stars: number }

/** Paires de notes [moi, l'autre] pour chaque film noté par les deux. */
export function ratingPairs(ratings: RatingLike[], a: string, b: string) {
  const byMatch = new Map<string, { a?: number; b?: number }>()
  for (const r of ratings) {
    const entry = byMatch.get(r.match_id) ?? {}
    if (r.user_id === a) entry.a = r.stars
    if (r.user_id === b) entry.b = r.stars
    byMatch.set(r.match_id, entry)
  }
  return [...byMatch].flatMap(([matchId, e]) => (e.a && e.b ? [{ matchId, a: e.a, b: e.b }] : []))
}

/** Taux d'accord en % : 100 = mêmes notes, 0 = 1 étoile contre 5 à chaque fois. null si aucun film noté par les deux. */
export function agreementRate(pairs: { a: number; b: number }[]): number | null {
  if (pairs.length === 0) return null
  const sum = pairs.reduce((s, p) => s + (1 - Math.abs(p.a - p.b) / 4), 0)
  return Math.round((sum / pairs.length) * 100)
}

export function agreementLabel(rate: number) {
  if (rate >= 90) return 'Âmes sœurs du cinéma'
  if (rate >= 75) return 'Sur la même longueur d’onde'
  if (rate >= 55) return 'D’accord pour ne pas être d’accord, parfois'
  return 'Les débats d’après-séance sont animés'
}

type Seasons = { number: number; episodes: number }[]

/** Épisode suivant : passe à la saison suivante en fin de saison ; null si c'était le dernier épisode connu. */
export function nextEpisode(seasons: Seasons, season: number, episode: number): { season: number; episode: number } | null {
  const current = seasons.find((s) => s.number === season)
  if (!current || episode < current.episodes) return { season, episode: episode + 1 }
  const next = seasons.find((s) => s.number > season)
  return next ? { season: next.number, episode: 1 } : null
}

type MovieLike = { title: string; runtime: number | null; genres: number[] }

/** Le Wrapped d'une année : films vus cette année-là (date du « Vu »). */
export function wrappedStats<M extends MovieLike>(year: number, matches: { id: string; done_at: string | null; movie: M }[], ratings: RatingLike[], betrayalDates: string[], a: string, b: string) {
  const seen = matches.filter((m) => m.done_at?.startsWith(String(year)))
  const ids = new Set(seen.map((m) => m.id))
  const pairs = ratingPairs(ratings.filter((r) => ids.has(r.match_id)), a, b)
  const movieOf = (id: string) => seen.find((m) => m.id === id)!.movie

  const genres = new Map<number, number>()
  for (const m of seen) for (const g of m.movie.genres) genres.set(g, (genres.get(g) ?? 0) + 1)
  const favoriteGenre = [...genres].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null

  const disagreement = [...pairs].sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b))[0]
  const best = [...pairs].sort((x, y) => y.a + y.b - (x.a + x.b))[0]

  return {
    year,
    count: seen.length,
    minutes: seen.reduce((s, m) => s + (m.movie.runtime ?? 0), 0),
    favoriteGenre,
    biggestDisagreement: disagreement && disagreement.a !== disagreement.b ? { movie: movieOf(disagreement.matchId), a: disagreement.a, b: disagreement.b } : null,
    bestRated: best ? { movie: movieOf(best.matchId), a: best.a, b: best.b } : null,
    agreement: agreementRate(pairs),
    betrayals: betrayalDates.filter((d) => d.startsWith(String(year))).length,
  }
}

/** Années pour lesquelles il y a au moins un film vu, la plus récente d'abord. */
export const wrappedYears = (matches: { done_at: string | null }[]) =>
  [...new Set(matches.flatMap((m) => (m.done_at ? [Number(m.done_at.slice(0, 4))] : [])))].sort((a, b) => b - a)
