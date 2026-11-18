import { useState } from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router'
import { Message } from '../../components/ui'
import { EventSheet, type EventSheetState } from './EventSheet'
import { useEvents, type CalEvent } from './hooks'

type CalendarContext = { events: CalEvent[]; open: (state: EventSheetState) => void }
export const useCalendar = () => useOutletContext<CalendarContext>()

const views = [
  { to: '/calendrier', label: 'Mois', end: true },
  { to: '/calendrier/a-venir', label: 'À venir', end: false },
]

export function Calendrier() {
  const { data: events, error } = useEvents()
  const [sheet, setSheet] = useState<EventSheetState>(null)

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <button type="button" onClick={() => setSheet({})} className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
          Ajouter
        </button>
      </header>
      <nav aria-label="Vues du calendrier" className="flex gap-1 rounded-full bg-white p-1">
        {views.map((v) => (
          <NavLink
            key={v.to}
            to={v.to}
            end={v.end}
            className={({ isActive }) =>
              `flex min-h-11 flex-1 items-center justify-center rounded-full font-semibold transition-colors ${isActive ? 'bg-lilas-fonce text-prune' : 'text-prune-doux'}`
            }
          >
            {v.label}
          </NavLink>
        ))}
      </nav>
      {error && <Message kind="error">{error}</Message>}
      <Outlet context={{ events, open: setSheet } satisfies CalendarContext} />
      <EventSheet state={sheet} onClose={() => setSheet(null)} />
    </>
  )
}
