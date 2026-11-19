import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { formatMonth } from '../../lib/dates'
import { CATEGORIES, type Category, type Expense } from './hooks'
import { formatEuros } from './money'

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthsAgo = (n: number) => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() - n, 1)
}
const shortMonth = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

/** Petit récap : un mois (par catégorie, par personne) puis les six derniers mois. */
export function Recap({ expenses }: { expenses: Expense[] }) {
  const { members, inkOf } = useAuth()
  const [offset, setOffset] = useState(0) // 0 = mois en cours
  const month = monthsAgo(offset)
  const inMonth = expenses.filter((e) => e.spent_on.startsWith(monthKey(month)))
  const total = inMonth.reduce((sum, e) => sum + e.amount_cents, 0)

  const byCategory = (Object.keys(CATEGORIES) as Category[])
    .map((c) => ({ c, cents: inMonth.filter((e) => e.category === c).reduce((sum, e) => sum + e.amount_cents, 0) }))
    .filter((x) => x.cents > 0)
    .sort((a, b) => b.cents - a.cents)
  const maxCategory = byCategory[0]?.cents ?? 1

  const lastSix = [5, 4, 3, 2, 1, 0].map((n) => {
    const m = monthsAgo(n)
    return { n, m, cents: expenses.filter((e) => e.spent_on.startsWith(monthKey(m))).reduce((sum, e) => sum + e.amount_cents, 0) }
  })
  const maxMonth = Math.max(1, ...lastSix.map((x) => x.cents))

  return (
    <>
      <section className="flex flex-col gap-4 rounded-[28px] bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setOffset(offset + 1)} aria-label="Mois précédent" className="grid size-11 place-items-center rounded-full bg-lilas active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold">{formatMonth(month)}</h2>
          <button
            type="button"
            onClick={() => setOffset(offset - 1)}
            disabled={offset === 0}
            aria-label="Mois suivant"
            className="grid size-11 place-items-center rounded-full bg-lilas active:scale-95 disabled:opacity-30"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <p className="text-center">
          <span className="block text-4xl font-bold">{formatEuros(total)}</span>
          <span className="text-prune-doux">dépensés ensemble</span>
        </p>

        {total > 0 && (
          <>
            <ul className="flex flex-col gap-2">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-2">
                  <span aria-hidden="true" className={`size-3 rounded-full ${inkOf(m.user_id) === 'a' ? 'bg-encre-a' : 'bg-encre-b'}`} />
                  <span className="flex-1 font-medium">{m.display_name} a payé</span>
                  <span className="font-semibold">{formatEuros(inMonth.filter((e) => e.paid_by === m.user_id).reduce((sum, e) => sum + e.amount_cents, 0))}</span>
                </li>
              ))}
            </ul>

            <ul className="flex flex-col gap-3">
              {byCategory.map(({ c, cents }) => (
                <li key={c} className="flex flex-col gap-1">
                  <span className="flex justify-between">
                    <span className="font-medium">{CATEGORIES[c]}</span>
                    <span className="font-semibold">{formatEuros(cents)}</span>
                  </span>
                  <span aria-hidden="true" className="h-3 rounded-full bg-lilas">
                    <span className="block h-full rounded-full bg-violet" style={{ width: `${Math.max(4, (cents / maxCategory) * 100)}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-[28px] bg-white p-5">
        <h2 className="text-xl font-bold">Six derniers mois</h2>
        <ul className="flex h-40 items-end gap-2">
          {lastSix.map(({ n, m, cents }) => (
            <li key={n} className="flex h-full flex-1 flex-col items-center gap-1">
              <span className="h-4 text-xs font-semibold text-prune-doux">{cents > 0 ? formatEuros(cents).replace(/,\d\d/, '') : ''}</span>
              <span className="relative w-full flex-1">
                <button
                  type="button"
                  onClick={() => setOffset(n)}
                  aria-label={`${formatMonth(m)} : ${formatEuros(cents)}`}
                  aria-pressed={offset === n}
                  className={`absolute inset-x-0 bottom-0 rounded-t-xl rounded-b-md transition-colors ${offset === n ? 'bg-violet' : 'bg-lilas-fonce'}`}
                  style={{ height: `${Math.max(6, (cents / maxMonth) * 100)}%` }}
                />
              </span>
              <span className="text-sm font-medium">{shortMonth.format(m).replace('.', '')}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
