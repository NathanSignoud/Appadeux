import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Message } from '../../components/ui'
import { imageUrl, tmdb, type Movie } from '../../lib/tmdb'
import { useMovieMatches } from '../cine/hooks'
import { countryName, DEFAULT_FILTERS, saveFilters } from '../cine/filters'
import { BADGES, badgeProgress, DECADES, MAP_ALIASES, passportStats, suggestions, type Stats, type Suggestion } from './passport'
import { WORLD, WORLD_VIEWBOX } from './worldMap'

const unlockedLooks = ['bg-menthe', 'bg-beurre', 'bg-peche']

export function Passeport() {
  const { data, loading, error } = useMovieMatches()
  const seen = data.filter((m) => m.done_at).map((m) => m.movie)
  const stats = passportStats(seen)
  const countries = [...stats.countries].sort((a, b) => b[1] - a[1])

  return (
    <>
      <h1 className="text-3xl font-bold">Passeport ciné</h1>
      {error && <Message kind="error">{error}</Message>}

      <ul className="grid grid-cols-3 gap-2 text-center">
        {[
          [stats.count, stats.count > 1 ? 'films vus' : 'film vu'],
          [stats.countries.size, 'pays'],
          [stats.decades.size, stats.decades.size > 1 ? 'décennies' : 'décennie'],
        ].map(([n, label]) => (
          <li key={label} className="rounded-[22px] bg-white px-2 py-3">
            <span className="block text-3xl font-bold">{n}</span>
            <span className="text-prune-doux">{label}</span>
          </li>
        ))}
      </ul>

      {!loading && seen.length === 0 && (
        <Message kind="info">Le passeport se remplit avec les films marqués « Vu » dans la watchlist. Premier tampon au prochain film !</Message>
      )}

      <section className="flex flex-col gap-3 rounded-[28px] bg-white p-4">
        <h2 className="px-1 text-xl font-bold">Nos pays</h2>
        <WorldMap stats={stats} />
        {countries.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {countries.map(([code, n]) => (
              <li key={code} className="rounded-full bg-lilas px-3 py-1.5 font-medium">
                {countryName(code)} <span className="text-prune-doux">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xl font-bold">Nos décennies</h2>
        <ol className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {DECADES.map((d) => {
            const n = stats.decades.get(d) ?? 0
            return (
              <li
                key={d}
                aria-label={`Années ${d} : ${n} film${n > 1 ? 's' : ''}`}
                className={`flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${n ? 'bg-violet text-white' : 'border-2 border-dashed border-violet/50 text-prune-doux'}`}
              >
                <span className="font-bold">{d}</span>
                <span className="text-sm">{n || '–'}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xl font-bold">
          Badges <span className="font-medium text-prune-doux">{BADGES.filter((b) => badgeProgress(b, stats) >= b.goal).length}/{BADGES.length}</span>
        </h2>
        <ul className="grid grid-cols-2 gap-2.5">
          {BADGES.map((b, i) => {
            const value = badgeProgress(b, stats)
            const unlocked = value >= b.goal
            return (
              <li
                key={b.id}
                className={`flex min-h-28 flex-col gap-1 rounded-[24px] p-4 ${unlocked ? unlockedLooks[i % 3] : 'border-2 border-dashed border-violet/50 bg-white/50'}`}
              >
                <span className={`text-lg leading-tight font-semibold ${unlocked ? '' : 'text-prune-doux'}`}>{b.title}</span>
                <span className="text-sm leading-snug text-prune-doux">{b.description}</span>
                {unlocked ? (
                  <span className="mt-auto text-sm font-semibold">Débloqué</span>
                ) : (
                  <span className="mt-auto flex items-center gap-2" aria-label={`${value} sur ${b.goal}`}>
                    <span className="h-2 flex-1 rounded-full bg-lilas-fonce">
                      <span className="block h-full rounded-full bg-violet" style={{ width: `${(value / b.goal) * 100}%` }} />
                    </span>
                    <span className="text-sm font-medium text-prune-doux">
                      {value}/{b.goal}
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <Suggestions stats={stats} />

      <p className="px-1 text-sm text-prune-doux">Carte : svg-maps de Victor Cazanave (CC BY 4.0), simplifiée.</p>
    </>
  )
}

function WorldMap({ stats }: { stats: Stats }) {
  const filled = new Set([...stats.countries.keys()].map((c) => MAP_ALIASES[c] ?? c))
  return (
    <svg viewBox={WORLD_VIEWBOX} role="img" aria-label={`Carte du monde : ${filled.size} pays coloriés`} className="w-full">
      {WORLD.map(([code, d, center]) => (
        <g key={code}>
          {d && <path d={d} className={filled.has(code) ? 'fill-violet' : 'fill-lilas-fonce'} stroke="white" strokeWidth={0.6} />}
          {center && filled.has(code) && <circle cx={center[0]} cy={center[1]} r={5} className="fill-violet" stroke="white" strokeWidth={1.5} />}
        </g>
      ))}
    </svg>
  )
}

const suggestionLabel = (s: Suggestion) => (s.country ? `le cinéma : ${countryName(s.country)}` : `les années ${s.decade}`)

/** « Pour compléter votre passeport, essayez… » → envoie le pays ou la décennie dans les filtres du swipe. */
function Suggestions({ stats }: { stats: Stats }) {
  const navigate = useNavigate()
  const options = suggestions(stats)
  const [index, setIndex] = useState(0)
  const [preview, setPreview] = useState<{ key: string; movies: Movie[] }>({ key: '', movies: [] })
  const option = options[index % Math.max(1, options.length)]
  const optionKey = option ? JSON.stringify(option) : ''
  const posters = preview.key === optionKey ? preview.movies : [] // l'aperçu d'une autre idée ne s'affiche pas

  useEffect(() => {
    if (!optionKey) return
    let alive = true
    tmdb
      .discover({ page: 1, genres: [], maxRuntime: null, providers: [], ...(JSON.parse(optionKey) as Suggestion) })
      .then(({ movies }) => alive && setPreview({ key: optionKey, movies: movies.filter((m) => m.posterPath).slice(0, 3) }))
      .catch(() => undefined) // pas d'aperçu : le bouton marche quand même
    return () => {
      alive = false
    }
  }, [optionKey])

  if (!option) return null

  return (
    <section className="flex flex-col gap-3 rounded-[28px] bg-peche p-5">
      <h2 className="text-xl font-bold">Pour compléter votre passeport, essayez {suggestionLabel(option)}</h2>
      <ul className="grid h-40 grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <li key={i} className="overflow-hidden rounded-2xl bg-white/50">
            {posters[i] && <img src={imageUrl(posters[i].posterPath, 'w185') ?? ''} alt={posters[i].title} className="size-full object-cover" />}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            saveFilters({ ...DEFAULT_FILTERS, ...option })
            navigate('/cine')
          }}
          className="min-h-12 flex-1 rounded-full bg-prune px-5 text-lg font-semibold text-white active:scale-[0.97]"
        >
          Swiper ces films
        </button>
        {options.length > 1 && (
          <button type="button" onClick={() => setIndex(index + 1)} className="min-h-12 rounded-full bg-white px-5 font-semibold active:scale-[0.97]">
            Autre idée
          </button>
        )}
      </div>
    </section>
  )
}
