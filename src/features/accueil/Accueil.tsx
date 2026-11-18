import { Link } from 'react-router'
import { Avatar, Overprint } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { coversDay, daysUntil, endOf, formatWhen, untilPhrase } from '../../lib/dates'
import { useEvents, type CalEvent } from '../calendrier/hooks'
import { lastSeenMatches, useMovieMatches } from '../cine/hooks'

const countdownText = (n: number) => (n === 0 ? 'Aujourd’hui !' : n === 1 ? 'Demain !' : `J-${n}`)

export function Accueil() {
  const { me, partner, inkOf } = useAuth()
  const { data: events } = useEvents()
  const { data: matches } = useMovieMatches()
  if (!me || !partner) return null

  const now = new Date()
  const countdowns = events.filter((e) => e.pinned && daysUntil(new Date(e.starts_at), now) >= 0)
  const [hero, ...otherCountdowns] = countdowns
  const absences = events.filter((e) => e.kind === 'absence' && coversDay(e, now))
  const next = events.find((e) => e.kind !== 'absence' && endOf(e) > now)
  const seen = lastSeenMatches()
  const newMatches = matches.filter((m) => m.source === 'match' && !m.done_at && m.created_at > seen).length
  const nameOf = (e: CalEvent) => (e.created_by === me.user_id ? null : partner.display_name)

  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coucou {me.display_name}</h1>
        <div className="flex gap-1.5">
          <Avatar name={me.display_name} ink={inkOf(me.user_id)} />
          <Avatar name={partner.display_name} ink={inkOf(partner.user_id)} />
        </div>
      </header>

      {hero ? <Countdown event={hero} /> : (
        <Overprint className="h-44">
          <p className="text-4xl font-bold">
            {me.display_name} & {partner.display_name}
          </p>
          <p className="px-10 text-lg font-medium">Épinglez un événement de l’agenda pour voir le compte à rebours ici.</p>
        </Overprint>
      )}

      {otherCountdowns.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {otherCountdowns.map((e) => (
            <li key={e.id} className="rounded-full bg-white px-4 py-2 font-medium">
              <span className="font-bold">{countdownText(daysUntil(new Date(e.starts_at), now))}</span> {e.title}
            </li>
          ))}
        </ul>
      )}

      {absences.map((e) => {
        const name = nameOf(e)
        return (
          <p
            key={e.id}
            className={`flex items-center gap-3 rounded-full px-5 py-3 text-lg font-medium ${inkOf(e.created_by) === 'a' ? 'bg-encre-a/25' : 'bg-encre-b/25'}`}
          >
            <span aria-hidden="true" className={`size-3 shrink-0 rounded-full ${inkOf(e.created_by) === 'a' ? 'bg-encre-a' : 'bg-encre-b'}`} />
            {name ? `${name} n’est pas là` : 'Tu n’es pas là'} {untilPhrase(new Date(e.ends_at), now)}
          </p>
        )
      })}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/calendrier/a-venir" className="flex min-h-32 flex-col gap-1 rounded-[28px_28px_28px_10px] bg-white p-4 active:scale-[0.97]">
          {next ? (
            <>
              <span className="text-sm font-medium text-prune-doux">{next.kind === 'together' ? 'Prochain moment à deux' : 'Prochainement'}</span>
              <span className="text-lg leading-tight font-semibold">{next.title}</span>
              <span className="mt-auto leading-tight text-prune-doux">{formatWhen(next, now)}</span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold">Agenda</span>
              <span className="mt-auto leading-tight text-prune-doux">Rien de prévu. On s’organise un truc ?</span>
            </>
          )}
        </Link>
        <Link
          to={newMatches ? '/cine/watchlist' : '/cine'}
          className="flex min-h-32 flex-col gap-1 rounded-[28px_28px_10px_28px] bg-menthe p-4 active:scale-[0.97]"
        >
          {newMatches ? (
            <>
              <span className="text-4xl leading-none font-bold">{newMatches}</span>
              <span className="mt-auto leading-tight">nouveau{newMatches > 1 ? 'x' : ''} match{newMatches > 1 ? 's' : ''} à regarder</span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold">Ciné</span>
              <span className="mt-auto leading-tight text-prune-doux">Pas de nouveau match. On swipe ce soir ?</span>
            </>
          )}
        </Link>
        <Link to="/listes" className="flex min-h-20 flex-col justify-end rounded-[28px] bg-beurre p-4 active:scale-[0.97]">
          <span className="text-lg font-semibold">Listes</span>
        </Link>
        <Link to="/alphabet" className="flex min-h-20 flex-col justify-end rounded-[10px_28px_28px_28px] bg-peche p-4 active:scale-[0.97]">
          <span className="text-lg font-semibold">Alphabet</span>
        </Link>
      </div>
    </>
  )
}

/** Compte à rebours épinglé : double encre si c'est à deux, pêche sinon. */
function Countdown({ event }: { event: CalEvent }) {
  const n = daysUntil(new Date(event.starts_at))
  const content = (
    <>
      <p className="text-6xl leading-none font-bold">{countdownText(n)}</p>
      <p className="px-8 text-xl font-medium">{n > 1 ? `avant ${event.title}` : event.title}</p>
    </>
  )
  return event.kind === 'together' ? (
    <Overprint className="h-48">{content}</Overprint>
  ) : (
    <div className="blob flex h-48 flex-col items-center justify-center gap-1 bg-peche text-center">{content}</div>
  )
}
