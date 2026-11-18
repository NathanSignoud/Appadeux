import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { coversDay, dayKey, formatDayLong, formatMonth, monthGrid, spanDays } from '../../lib/dates'
import { useCalendar } from './Calendrier'
import { EventItem } from './EventItem'
import type { CalEvent } from './hooks'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function MonthView() {
  const { events, open } = useCalendar()
  const { inkOf } = useAuth()
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())

  const today = dayKey(new Date())
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const ofDay = (d: Date) => events.filter((e) => coversDay(e, d))
  const inkVar = (e: CalEvent) => (inkOf(e.created_by) === 'a' ? 'var(--color-encre-a)' : 'var(--color-encre-b)')
  const dayEvents = ofDay(selected)

  return (
    <>
      <section className="flex flex-col gap-3 rounded-[28px] bg-white p-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} aria-label="Mois précédent" className="grid size-11 place-items-center rounded-full bg-lilas">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold" aria-live="polite">
            {formatMonth(month)}
          </h2>
          <button type="button" onClick={() => shift(1)} aria-label="Mois suivant" className="grid size-11 place-items-center rounded-full bg-lilas">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-sm font-medium text-prune-doux" aria-hidden="true">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        {/* gap-x nul : les bandeaux d'absence se rejoignent d'un jour à l'autre */}
        <div className="grid grid-cols-7 gap-y-1">
          {monthGrid(month).map((d) => {
            const key = dayKey(d)
            const items = ofDay(d)
            const absences = items.filter((e) => e.kind === 'absence')
            const others = items.filter((e) => e.kind !== 'absence').slice(0, 3)
            const isSelected = key === dayKey(selected)
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(d)}
                aria-pressed={isSelected}
                aria-label={`${formatDayLong(d)}${items.length ? `, ${items.length} événement${items.length > 1 ? 's' : ''}` : ''}`}
                className={`flex h-14 flex-col items-stretch gap-0.5 pt-1 ${d.getMonth() !== month.getMonth() ? 'opacity-40' : ''}`}
              >
                <span
                  className={`mx-auto grid size-7 place-items-center rounded-full text-sm ${
                    isSelected ? 'bg-prune font-semibold text-white' : key === today ? 'bg-lilas-fonce font-semibold' : ''
                  }`}
                >
                  {d.getDate()}
                </span>
                {absences.map((e) => {
                  const [first, last] = spanDays(e)
                  return (
                    <span
                      key={e.id}
                      aria-hidden="true"
                      className={`h-1.5 opacity-70 ${key === first || d.getDay() === 1 ? 'ml-1 rounded-l-full' : ''} ${key === last || d.getDay() === 0 ? 'mr-1 rounded-r-full' : ''}`}
                      style={{ background: inkVar(e) }}
                    />
                  )
                })}
                <span className="flex justify-center gap-0.5" aria-hidden="true">
                  {others.map((e) =>
                    e.kind === 'together' ? (
                      <span key={e.id} className="relative isolate h-1.5 w-2.5">
                        <span className="absolute left-0 size-1.5 rounded-full bg-encre-a mix-blend-multiply" />
                        <span className="absolute right-0 size-1.5 rounded-full bg-encre-b mix-blend-multiply" />
                      </span>
                    ) : (
                      <span key={e.id} className="size-1.5 rounded-full" style={{ background: inkVar(e) }} />
                    ),
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold first-letter:uppercase">{formatDayLong(selected)}</h2>
          <button
            type="button"
            onClick={() => open({ day: selected })}
            className="min-h-11 shrink-0 font-semibold underline underline-offset-4"
            aria-label={`Ajouter un événement le ${formatDayLong(selected)}`}
          >
            Ajouter ce jour-là
          </button>
        </div>
        {dayEvents.length === 0 ? (
          <p className="rounded-[24px] bg-white p-4 text-prune-doux">Rien de prévu ce jour-là.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {dayEvents.map((e) => (
              <EventItem key={e.id} event={e} onOpen={(event) => open({ event })} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
