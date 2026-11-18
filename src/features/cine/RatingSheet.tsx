import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Message } from '../../components/ui'
import { frenchError, supabase } from '../../lib/supabase'
import type { MovieMatch, Rating } from './hooks'

type Props = { match: MovieMatch | null; mine: Rating | undefined; onClose: () => void }

export function RatingSheet(props: Props) {
  return (
    <Sheet open={props.match !== null} onClose={props.onClose} title={props.match ? `Ta note : ${props.match.movie.title}` : 'Ta note'}>
      {props.match && <Form {...props} match={props.match} />}
    </Sheet>
  )
}

function Form({ match, mine, onClose }: Props & { match: MovieMatch }) {
  const [stars, setStars] = useState(mine?.stars ?? 0)
  const [comment, setComment] = useState(mine?.comment ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!stars) return setError('Choisis une note de 1 à 5 étoiles.')
    setBusy(true)
    const fields = { stars, comment: comment.trim() || null }
    // Pas d'upsert : seules la note et le commentaire sont modifiables en base (voir la migration)
    const { error } = mine
      ? await supabase.from('ratings').update({ ...fields, updated_at: new Date().toISOString() }).eq('match_id', match.id).eq('user_id', mine.user_id)
      : await supabase.from('ratings').insert({ ...fields, match_id: match.id })
    setBusy(false)
    if (error) setError(frenchError(error))
    else onClose()
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 font-semibold">Combien d’étoiles ?</legend>
        <div className="flex justify-between rounded-[24px] bg-white px-3 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="grid size-12 cursor-pointer place-items-center text-4xl has-focus-visible:rounded-full has-focus-visible:ring-3 has-focus-visible:ring-violet">
              <input type="radio" name="stars" value={n} checked={stars === n} onChange={() => setStars(n)} className="sr-only" />
              <span aria-hidden="true" className={n <= stars ? 'text-violet' : 'text-lilas-fonce'}>
                ★
              </span>
              <span className="sr-only">{n} sur 5</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment" className="px-1 font-medium text-prune-doux">
          Un petit mot ? (facultatif)
        </label>
        <textarea
          id="comment"
          rows={3}
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="rounded-2xl bg-white p-4 text-lg outline-none focus-visible:ring-3 focus-visible:ring-violet"
        />
      </div>
      {error && <Message kind="error">{error}</Message>}
      <Button type="submit" disabled={busy}>
        Enregistrer ma note
      </Button>
    </form>
  )
}
