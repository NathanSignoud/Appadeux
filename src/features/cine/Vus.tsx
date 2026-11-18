import { useState } from 'react'
import { Avatar, Message, Stars } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { useMovieMatches, useRatings, type MovieMatch } from './hooks'
import { MovieRow } from './MovieRow'
import { RatingSheet } from './RatingSheet'

export function Vus() {
  const { me, partner, inkOf } = useAuth()
  const { data, loading, error } = useMovieMatches()
  const { data: ratings } = useRatings()
  const [rating, setRating] = useState<MovieMatch | null>(null)
  if (!me || !partner) return null

  const watched = data.filter((m) => m.done_at).sort((a, b) => b.done_at!.localeCompare(a.done_at!))
  const ratingOf = (matchId: string, userId: string) => ratings.find((r) => r.match_id === matchId && r.user_id === userId)

  return (
    <>
      {error && <Message kind="error">{error}</Message>}

      {!loading && watched.length === 0 && (
        <div className="blob grid h-48 place-items-center bg-white px-10 text-center">
          <p className="text-lg text-prune-doux">Aucun film vu ensemble pour l’instant. Appuyez sur « Vu » dans la watchlist après une séance.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {watched.map((m) => {
          const mine = ratingOf(m.id, me.user_id)
          const theirs = ratingOf(m.id, partner.user_id)
          return (
            <MovieRow key={m.id} movie={m.movie}>
              <div className="flex flex-col gap-2 pt-1">
                <RatingLine name={me.display_name} ink={inkOf(me.user_id)} stars={mine?.stars} comment={mine?.comment} empty="Pas encore noté" />
                {/* On ne voit la note de l'autre qu'après avoir donné la sienne : pas d'influence */}
                {mine ? (
                  <RatingLine name={partner.display_name} ink={inkOf(partner.user_id)} stars={theirs?.stars} comment={theirs?.comment} empty="Pas encore noté" />
                ) : (
                  <p className="text-sm text-prune-doux">
                    {theirs ? `${partner.display_name} a noté. À toi pour découvrir sa note !` : `${partner.display_name} n’a pas encore noté.`}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setRating(m)} className="mt-1 min-h-11 self-start font-semibold underline underline-offset-4">
                {mine ? 'Modifier ma note' : 'Noter ce film'}
              </button>
            </MovieRow>
          )
        })}
      </ul>

      <RatingSheet match={rating} mine={rating ? ratingOf(rating.id, me.user_id) : undefined} onClose={() => setRating(null)} />
    </>
  )
}

function RatingLine({ name, ink, stars, comment, empty }: { name: string; ink: 'a' | 'b'; stars?: number; comment?: string | null; empty: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <Avatar name={name} ink={ink} />
        {stars ? <Stars value={stars} /> : <span className="text-sm text-prune-doux">{empty}</span>}
      </div>
      {comment && <p className="pl-11 leading-snug">« {comment} »</p>}
    </div>
  )
}
