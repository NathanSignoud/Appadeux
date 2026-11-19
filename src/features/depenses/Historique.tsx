import { useState } from 'react'
import { Chip } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { dayKey, formatDayShort, formatMonth } from '../../lib/dates'
import { frenchError, supabase } from '../../lib/supabase'
import { CATEGORIES, type Category, type Expense, type Settlement } from './hooks'
import { formatEuros, owedFor } from './money'

type Entry = { day: string; expense: Expense; settlement?: never } | { day: string; settlement: Settlement; expense?: never }

const parseDay = (key: string) => new Date(`${key}T00:00`)

export function Historique({
  expenses,
  settlements,
  loading,
  onEdit,
  onError,
}: {
  expenses: Expense[]
  settlements: Settlement[]
  loading: boolean
  onEdit: (e: Expense) => void
  onError: (message: string) => void
}) {
  const { members } = useAuth()
  const [filter, setFilter] = useState<Category | null>(null)
  const nameOf = (id: string) => members.find((m) => m.user_id === id)?.display_name ?? '?'
  const otherName = (id: string) => members.find((m) => m.user_id !== id)?.display_name ?? '?'

  // Les remboursements n'ont pas de catégorie : visibles seulement sans filtre
  const entries: Entry[] = [
    ...expenses.filter((e) => !filter || e.category === filter).map((expense) => ({ day: expense.spent_on, expense })),
    ...(filter ? [] : settlements.map((settlement) => ({ day: dayKey(new Date(settlement.created_at)), settlement }))),
  ].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0))

  const months = new Map<string, Entry[]>()
  for (const entry of entries) {
    const key = entry.day.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), entry])
  }
  const used = new Set(expenses.map((e) => e.category as Category))

  async function cancelSettlement(s: Settlement) {
    if (!confirm(`Annuler ce remboursement de ${formatEuros(s.amount_cents)} ?`)) return
    const { error } = await supabase.from('settlements').delete().eq('id', s.id)
    if (error) onError(frenchError(error))
  }

  if (!loading && expenses.length === 0 && settlements.length === 0) {
    return (
      <div className="blob grid h-44 place-items-center bg-white px-10 text-center">
        <p className="text-lg text-prune-doux">Aucune dépense pour l’instant. Ajoutez la prochaine course ou le prochain resto.</p>
      </div>
    )
  }

  return (
    <>
      {used.size > 1 && (
        <div role="group" aria-label="Filtrer par catégorie" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          <Chip pressed={!filter} onClick={() => setFilter(null)} className="shrink-0">
            Tout
          </Chip>
          {(Object.keys(CATEGORIES) as Category[])
            .filter((c) => used.has(c))
            .map((c) => (
              <Chip key={c} pressed={filter === c} onClick={() => setFilter(c)} className="shrink-0">
                {CATEGORIES[c]}
              </Chip>
            ))}
        </div>
      )}

      {[...months].map(([key, list]) => (
        <section key={key} className="flex flex-col gap-2">
          <h2 className="flex items-baseline justify-between px-1">
            <span className="text-xl font-bold">{formatMonth(parseDay(`${key}-01`))}</span>
            <span className="font-medium text-prune-doux">{formatEuros(list.reduce((sum, e) => sum + (e.expense?.amount_cents ?? 0), 0))}</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {list.map(({ expense: e, settlement: s, day }) =>
              e ? (
                <li key={e.id}>
                  <button type="button" onClick={() => onEdit(e)} className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left active:scale-[0.98]">
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg leading-tight font-semibold break-words">{e.label}</span>
                      <span className="block text-sm text-prune-doux">
                        {CATEGORIES[e.category as Category]}, payé par {nameOf(e.paid_by)} le {formatDayShort(parseDay(day))}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-lg font-bold">{formatEuros(e.amount_cents)}</span>
                      {e.owed_cents !== owedFor(e.amount_cents, 'equal') && (
                        <span className="block text-sm text-prune-doux">
                          {e.owed_cents === 0 ? 'rien à partager' : `part de ${otherName(e.paid_by)} : ${formatEuros(e.owed_cents)}`}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ) : (
                <li key={s.id} className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-dashed border-violet/60 px-4 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg leading-tight font-semibold">Remboursement</span>
                    <span className="block text-sm text-prune-doux">
                      {nameOf(s.from_user)} a remboursé {nameOf(s.to_user)} le {formatDayShort(parseDay(day))}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg font-bold">{formatEuros(s.amount_cents)}</span>
                  <button
                    type="button"
                    onClick={() => cancelSettlement(s)}
                    aria-label="Annuler ce remboursement"
                    className="grid size-11 shrink-0 place-items-center rounded-full text-prune-doux active:scale-95"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </>
  )
}
