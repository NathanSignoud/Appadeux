import { useMemo, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { SwipeDeck } from '../swipe/SwipeDeck'
import { filterSummary, loadFilters, saveFilters } from './filters'
import { FiltersSheet } from './FiltersSheet'
import { movieSource } from './movieSource'

export function CineSwipe() {
  const { providers } = useAuth()
  const [filters, setFilters] = useState(loadFilters)
  const [open, setOpen] = useState(false)
  const source = useMemo(() => movieSource(filters, providers), [filters, providers])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 items-center justify-between gap-3 rounded-full bg-white px-5 text-left"
      >
        <span className="truncate">
          <span className="text-prune-doux">Ce soir : </span>
          {filterSummary(filters)}
        </span>
        <span className="shrink-0 font-semibold underline underline-offset-4">Filtres</span>
      </button>

      <SwipeDeck
        source={source}
        empty={<p className="text-lg text-prune-doux">Vous avez tout vu avec ces filtres. Élargissez un peu pour découvrir d’autres films.</p>}
      />

      <FiltersSheet
        open={open}
        onClose={() => setOpen(false)}
        filters={filters}
        hasProviders={providers.length > 0}
        onApply={(f) => {
          setFilters(f)
          saveFilters(f)
        }}
      />
    </>
  )
}
