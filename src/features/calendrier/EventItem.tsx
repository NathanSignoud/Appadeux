import { useAuth } from '../../lib/auth'
import { formatWhen } from '../../lib/dates'
import type { CalEvent } from './hooks'

/** Repère de couleur : l'encre de la personne, les deux encres superposées pour « à deux », hachuré pour une absence. */
export function KindMark({ event, className = '' }: { event: CalEvent; className?: string }) {
  const { inkOf } = useAuth()
  if (event.kind === 'together') {
    return (
      <span aria-hidden="true" className={`relative isolate block w-3 shrink-0 ${className}`}>
        <span className="absolute inset-y-0 left-0 w-2 rounded-full bg-encre-a mix-blend-multiply dark:mix-blend-screen" />
        <span className="absolute inset-y-0 right-0 w-2 rounded-full bg-encre-b mix-blend-multiply dark:mix-blend-screen" />
      </span>
    )
  }
  const ink = inkOf(event.created_by) === 'a' ? 'var(--color-encre-a)' : 'var(--color-encre-b)'
  return (
    <span
      aria-hidden="true"
      className={`block w-2 shrink-0 rounded-full ${className}`}
      style={{ background: event.kind === 'absence' ? `repeating-linear-gradient(180deg, ${ink} 0 5px, transparent 5px 8px)` : ink }}
    />
  )
}

export function EventItem({ event, onOpen }: { event: CalEvent; onOpen: (e: CalEvent) => void }) {
  const { members } = useAuth()
  const who = members.find((m) => m.user_id === event.created_by)?.display_name
  const subtitle = event.kind === 'absence' ? `${who} n’est pas là` : event.kind === 'solo' ? `${who}, en solo` : 'À deux'

  return (
    <li>
      <button type="button" onClick={() => onOpen(event)} className="flex w-full gap-3 rounded-[24px] bg-white p-3 text-left active:scale-[0.99]">
        <KindMark event={event} className="self-stretch" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-lg leading-tight font-semibold">{event.title}</span>
          <span className="text-prune-doux">{formatWhen(event)}</span>
          <span className="text-sm text-prune-doux">
            {[subtitle, event.location, event.pinned ? 'compte à rebours sur l’accueil' : null].filter(Boolean).join(' · ')}
          </span>
        </span>
      </button>
    </li>
  )
}
