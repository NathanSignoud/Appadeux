import { formatRuntime, genreName, MOODS } from '../../lib/tmdb'

/** Filtres du soir : propres à chaque téléphone (localStorage), pas partagés. */
export type CineFilters = { mood: string | null; maxRuntime: number | null; genres: number[]; onlyOurs: boolean }

export const DEFAULT_FILTERS: CineFilters = { mood: null, maxRuntime: null, genres: [], onlyOurs: false }

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
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'tous les films'
}
