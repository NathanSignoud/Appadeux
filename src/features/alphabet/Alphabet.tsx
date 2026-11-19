import { Link } from 'react-router'
import { Message, Overprint } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { formatDayShort } from '../../lib/dates'
import { useSignedUrls } from '../../lib/photos'
import { BUCKET, coverOf, LETTERS, organizerOf, statusOf, useLetters } from './hooks'

// Coins « guimauve » qui tournent d'une case à l'autre
const corners = ['rounded-[22px_22px_22px_8px]', 'rounded-[22px_22px_8px_22px]', 'rounded-[8px_22px_22px_22px]', 'rounded-[22px_8px_22px_22px]']

export function Alphabet() {
  const { me, members } = useAuth()
  const { data, error } = useLetters()
  const rowOf = (l: string) => data.find((r) => r.letter === l)
  const covers = useSignedUrls(BUCKET, data.map(coverOf).filter((p): p is string => !!p))

  const done = LETTERS.filter((l) => statusOf(rowOf(l)) === 'done').length
  const next = LETTERS.find((l) => statusOf(rowOf(l)) !== 'done')
  const nextOrganizer = next ? organizerOf(next, rowOf(next), members) : null

  return (
    <>
      <h1 className="text-3xl font-bold">Alphabet des dates</h1>
      {error && <Message kind="error">{error}</Message>}

      {next ? (
        <Link to={`/alphabet/${next}`} className="active:scale-[0.98]">
          <Overprint className="h-40">
            <p className="text-6xl leading-none font-bold">{next}</p>
            <p className="px-8 text-lg font-medium">
              {rowOf(next)?.title
                ? `${next} comme ${rowOf(next)!.title}`
                : nextOrganizer?.user_id === me?.user_id
                  ? 'C’est à toi d’organiser'
                  : `C’est au tour de ${nextOrganizer?.display_name}`}
            </p>
          </Overprint>
        </Link>
      ) : (
        <Overprint className="h-40">
          <p className="text-5xl font-bold">De A à Z</p>
          <p className="text-lg font-medium">26 dates, l’alphabet est complet.</p>
        </Overprint>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-1">
          <span className="font-medium text-prune-doux">Progression</span>
          <span className="text-xl font-bold">{done}/26</span>
        </div>
        <div className="h-4 rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={26} aria-valuenow={done} aria-label="Lettres faites">
          <div className="h-full rounded-full bg-violet transition-[width] duration-500" style={{ width: `${(done / 26) * 100}%` }} />
        </div>
      </div>

      <ul className="grid grid-cols-4 gap-2.5">
        {LETTERS.map((l, i) => {
          const row = rowOf(l)
          const status = statusOf(row)
          const cover = status === 'done' ? covers(coverOf(row)) : undefined
          const look =
            status === 'done' ? 'bg-violet text-white' : status === 'planned' ? 'bg-peche text-prune' : 'bg-white text-prune-doux'
          const label = `${l}${row?.title ? ` comme ${row.title}` : ''}, ${status === 'done' ? 'faite' : status === 'planned' ? 'planifiée' : 'à faire'}`
          return (
            <li key={l}>
              <Link
                to={`/alphabet/${l}`}
                aria-label={label}
                className={`relative flex aspect-square flex-col items-center justify-center overflow-hidden bg-cover bg-center active:scale-95 ${corners[i % 4]} ${look}`}
                style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
              >
                {cover && <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-prune/70 to-prune/10" />}
                <span className="relative text-4xl font-bold">{l}</span>
                {status === 'planned' && row?.date_on && (
                  <span className="relative text-xs font-medium">{formatDayShort(new Date(`${row.date_on}T00:00`)).replace(/^\S+ /, '')}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="px-1 text-prune-doux">
        Chacun son tour : une lettre, un date dont le thème commence par cette lettre. Une lettre faite se remplit avec sa première photo.
      </p>
    </>
  )
}
