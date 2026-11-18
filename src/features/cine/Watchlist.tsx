import { useState } from 'react'
import { Button, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { useMovieMatches, useRatings, type MovieMatch } from './hooks'
import { MatchBadge, MovieRow } from './MovieRow'
import { RatingSheet } from './RatingSheet'
import { SearchSheet } from './SearchSheet'

export function Watchlist() {
  const { me, members } = useAuth()
  const { data, loading, error } = useMovieMatches()
  const { data: ratings } = useRatings()
  const [searchOpen, setSearchOpen] = useState(false)
  const [rating, setRating] = useState<MovieMatch | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const todo = data.filter((m) => !m.done_at)
  const nameOf = (id: string | null) => members.find((m) => m.user_id === id)?.display_name

  async function markSeen(m: MovieMatch) {
    const { error } = await supabase.from('matches').update({ done_at: new Date().toISOString() }).eq('id', m.id)
    if (error) setActionError(frenchError(error))
    else setRating(m) // « Vu » ouvre directement la notation
  }

  async function remove(m: MovieMatch) {
    if (!confirm(`Retirer « ${m.movie.title} » de la watchlist ?`)) return
    const { error } = await supabase.from('matches').delete().eq('id', m.id)
    if (error) setActionError(frenchError(error))
  }

  return (
    <>
      <Button variant="soft" onClick={() => setSearchOpen(true)}>
        Ajouter un film à la main
      </Button>

      {(error || actionError) && <Message kind="error">{error ?? actionError}</Message>}

      {!loading && todo.length === 0 && (
        <div className="blob grid h-48 place-items-center bg-white px-10 text-center">
          <p className="text-lg text-prune-doux">Rien à regarder pour l’instant. Swipez un peu, ou ajoutez un film à la main.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {todo.map((m) => (
          <MovieRow key={m.id} movie={m.movie}>
            {m.source === 'match' ? <MatchBadge /> : <span className="text-sm text-prune-doux">Ajouté par {nameOf(m.added_by) ?? 'vous'}</span>}
            <div className="mt-auto flex items-center gap-2">
              <button type="button" onClick={() => markSeen(m)} className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
                Vu
              </button>
              <button
                type="button"
                onClick={() => remove(m)}
                aria-label={`Retirer ${m.movie.title}`}
                className="grid size-11 place-items-center rounded-full bg-lilas text-prune-doux active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </MovieRow>
        ))}
      </ul>

      <SearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} existing={new Set(data.map((m) => m.item_id))} />
      <RatingSheet
        match={rating}
        mine={ratings.find((r) => r.match_id === rating?.id && r.user_id === me?.user_id)}
        onClose={() => setRating(null)}
      />
    </>
  )
}
