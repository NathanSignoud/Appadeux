import { useState } from 'react'
import { Link } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { Button, Chip } from '../../components/ui'
import { GENRES, MOODS } from '../../lib/tmdb'
import { DEFAULT_FILTERS, type CineFilters } from './filters'

const DURATIONS = [
  { value: null, label: 'Peu importe' },
  { value: 90, label: '1 h 30' },
  { value: 120, label: '2 h' },
  { value: 150, label: '2 h 30' },
]

type Props = { open: boolean; onClose: () => void; filters: CineFilters; onApply: (f: CineFilters) => void; hasProviders: boolean }

export function FiltersSheet(props: Props) {
  return (
    <Sheet open={props.open} onClose={props.onClose} title="Filtres du soir">
      <Form {...props} />
    </Sheet>
  )
}

// Brouillon local : le paquet n'est rechargé qu'au clic sur « Voir les films », pas à chaque pastille
function Form({ filters, onApply, onClose, hasProviders }: Props) {
  const [draft, setDraft] = useState(filters)
  const set = (patch: Partial<CineFilters>) => setDraft({ ...draft, ...patch })
  const toggleGenre = (id: number) => set({ genres: draft.genres.includes(id) ? draft.genres.filter((g) => g !== id) : [...draft.genres, id] })

  return (
    <div className="flex max-h-[70dvh] flex-col gap-5 overflow-y-auto">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Humeur</legend>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Chip key={m.id} pressed={draft.mood === m.id} onClick={() => set({ mood: draft.mood === m.id ? null : m.id })}>
              {m.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Durée maximum</legend>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <Chip key={d.label} pressed={draft.maxRuntime === d.value} onClick={() => set({ maxRuntime: d.value })}>
              {d.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Genres</legend>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Chip key={g.id} pressed={draft.genres.includes(g.id)} onClick={() => toggleGenre(g.id)}>
              {g.name}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 rounded-[24px] bg-white p-4">
        <label className="flex min-h-11 items-center justify-between gap-3 font-semibold">
          Seulement sur nos abonnements
          <input
            type="checkbox"
            checked={draft.onlyOurs}
            disabled={!hasProviders}
            onChange={(e) => set({ onlyOurs: e.target.checked })}
            className="size-6 accent-prune"
          />
        </label>
        {!hasProviders && (
          <p className="text-prune-doux">
            Choisissez d’abord vos abonnements dans{' '}
            <Link to="/parametres" className="font-medium underline underline-offset-4">
              Paramètres
            </Link>
            .
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="soft" onClick={() => setDraft(DEFAULT_FILTERS)} className="flex-1">
          Tout effacer
        </Button>
        <Button
          type="button"
          onClick={() => {
            onApply(draft)
            onClose()
          }}
          className="flex-1"
        >
          Voir les films
        </Button>
      </div>
    </div>
  )
}
