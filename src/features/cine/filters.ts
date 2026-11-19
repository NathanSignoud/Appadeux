import { formatRuntime, genreName, MOODS } from '../../lib/tmdb'

/** Filtres du soir : propres à chaque téléphone (localStorage), pas partagés. country / decade viennent des suggestions du passeport. */
export type CineFilters = { mood: string | null; maxRuntime: number | null; genres: number[]; onlyOurs: boolean; country: string | null; decade: number | null }

export const DEFAULT_FILTERS: CineFilters = { mood: null, maxRuntime: null, genres: [], onlyOurs: false, country: null, decade: null }

const regions = new Intl.DisplayNames(['fr'], { type: 'region' })
export const countryName = (code: string) => regions.of(code) ?? code

const KEY = 'nous.filtres-cine'

export function loadFilters(): CineFilters {
  try {
    return { ...DEFAULT_FILTERS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULT_FILTERS
  }
}

export function saveFilters(filters: CineFilters) {
  try {
    localStorage.setItem(KEY, JSON.stringify(filters))
  } catch {
    // navigation privée : les filtres ne survivront pas au rechargement, rien de grave
  }
}

export function filterSummary(f: CineFilters) {
  const parts = [
    MOODS.find((m) => m.id === f.mood)?.label,
    f.maxRuntime ? `${formatRuntime(f.maxRuntime)} max` : null,
    f.genres.length ? f.genres.map(genreName).join(', ') : null,
    f.onlyOurs ? 'nos abonnements' : null,
    f.country ? `cinéma : ${countryName(f.country)}` : null,
    f.decade ? `années ${f.decade}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'tous les films'
}
