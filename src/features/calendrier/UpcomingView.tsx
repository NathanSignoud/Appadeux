import { dayKey, dayLabel, endOf } from '../../lib/dates'
import { useCalendar } from './Calendrier'
import { EventItem } from './EventItem'
import type { CalEvent } from './hooks'

export function UpcomingView() {
  const { events, open } = useCalendar()
  const now = new Date()
  // Ce qui n'est pas terminé (une absence en cours reste visible), regroupé par jour de début
  const upcoming = events.filter((e) => endOf(e) > now).slice(0, 60)
  const groups = new Map<string, CalEvent[]>()
  for (const e of upcoming) {
    const key = dayKey(new Date(e.starts_at) < now ? now : new Date(e.starts_at))
    groups.set(key, [...(groups.get(key) ?? []), e])
  }

  if (upcoming.length === 0) {
    return (
      <div className="blob grid h-48 place-items-center bg-white px-10 text-center">
        <p className="text-lg text-prune-doux">Rien de prévu pour l’instant. Ajoutez votre prochain moment à deux !</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {[...groups].map(([key, items]) => (
        <section key={key} className="flex flex-col gap-2">
          <h2 className="px-1 text-lg font-semibold">{dayLabel(new Date(`${key}T12:00`), now)}</h2>
          <ul className="flex flex-col gap-2">
            {items.map((e) => (
              <EventItem key={e.id} event={e} onOpen={(event) => open({ event })} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
