import { useState } from 'react'
import { Avatar, EmptyState, Message, Overprint, Stars } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { useBetrayals, useMovieMatches, useRatings, type MovieMatch } from './hooks'
import { MovieRow } from './MovieRow'
import { RatingSheet } from './RatingSheet'
import { agreementLabel, agreementRate, ratingPairs, wrappedStats, wrappedYears } from './stats'
import { Wrapped } from './Wrapped'

export function Vus() {
  const { me, partner, inkOf } = useAuth()
  const { data, loading, error } = useMovieMatches()
  const { data: ratings } = useRatings()
  const { data: betrayals } = useBetrayals()
  const [rating, setRating] = useState<MovieMatch | null>(null)
  const [wrappedYear, setWrappedYear] = useState<number | null>(null)
  if (!me || !partner) return null

  const watched = data.filter((m) => m.done_at).sort((a, b) => b.done_at!.localeCompare(a.done_at!))
  const ratingOf = (matchId: string, userId: string) => ratings.find((r) => r.match_id === matchId && r.user_id === userId)

  const rate = agreementRate(ratingPairs(ratings, me.user_id, partner.user_id))
  const years = wrappedYears(data)

  return (
    <>
      {error && <Message kind="error">{error}</Message>}

      {rate !== null && (
        <Overprint className="h-36">
          <p className="text-5xl font-bold">{rate} %</p>
          <p className="px-8 text-lg font-medium">d’accord sur vos notes. {agreementLabel(rate)}</p>
        </Overprint>
      )}

      {years.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {years.slice(0, 3).map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setWrappedYear(y)}
              className="flex min-h-14 flex-1 items-center justify-center rounded-[22px_22px_22px_8px] bg-beurre px-4 text-lg font-semibold active:scale-[0.97]"
            >
              Votre année ciné {y}
            </button>
          ))}
        </div>
      )}

      {!loading && watched.length === 0 && (
        <EmptyState>Aucun film vu ensemble pour l’instant. Appuyez sur « Vu » dans la watchlist après une séance.</EmptyState>
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

      {wrappedYear && (
        <Wrapped
          stats={wrappedStats(wrappedYear, data, ratings, betrayals.map((b) => b.created_at), me.user_id, partner.user_id)}
          onClose={() => setWrappedYear(null)}
        />
      )}
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
