import { useEffect, useState } from 'react'
import { Button, EmptyState, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { tmdb, type SearchResult } from '../../lib/tmdb'
import { markMatchesSeen, useMovieMatches, useRatings, useVetoes, weekStart, type MovieMatch } from './hooks'
import { MatchBadge, MovieRow } from './MovieRow'
import { RatingSheet } from './RatingSheet'
import { Roulette } from './Roulette'
import { SearchSheet } from './SearchSheet'

async function addMovie(r: SearchResult) {
  const movie = await tmdb.movie(r.id) // détails complets : durée, pays, plateformes
  const { error } = await supabase.from('matches').insert({ kind: 'movie', item_id: String(r.id), payload: movie, source: 'manual' })
  return error ? (error.code === '23505' ? 'Ce film est déjà dans votre liste.' : frenchError(error)) : null
}

export function Watchlist() {
  const { me, partner, members } = useAuth()
  const { data, loading, error } = useMovieMatches()
  const { data: ratings } = useRatings()
  const { data: vetoes } = useVetoes()
  const [searchOpen, setSearchOpen] = useState(false)
  const [rouletteOpen, setRouletteOpen] = useState(false)
  const [rating, setRating] = useState<MovieMatch | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(markMatchesSeen, [])

  const todo = data.filter((m) => !m.done_at)
  const nameOf = (id: string | null) => members.find((m) => m.user_id === id)?.display_name
  const thisWeek = vetoes.filter((v) => v.week_start === weekStart())
  const myVeto = thisWeek.find((v) => v.user_id === me?.user_id)
  const partnerVeto = thisWeek.find((v) => v.user_id === partner?.user_id)

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

  async function veto(m: MovieMatch) {
    if (!confirm(`Utiliser ton veto de la semaine sur « ${m.movie.title} » ? Le film quitte la watchlist, et ton veto revient lundi.`)) return
    const { error } = await supabase.rpc('use_veto', { p_match_id: m.id })
    setActionError(error ? frenchError(error) : null)
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="soft" onClick={() => setSearchOpen(true)} className="flex-1">
          Ajouter un film
        </Button>
        {todo.length > 1 && (
          <Button onClick={() => setRouletteOpen(true)} className="flex-1">
            Roulette
          </Button>
        )}
      </div>

      {/* Joker veto : 1 par personne et par semaine, remis à zéro le lundi */}
      <div className="flex items-center gap-3 rounded-[24px] bg-white px-4 py-3">
        <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-full font-bold ${myVeto ? 'bg-lilas-fonce text-prune-doux' : 'bg-peche'}`}>
          {myVeto ? 0 : 1}
        </span>
        <p className="leading-snug">
          {myVeto ? (
            <>
              Veto utilisé sur « {myVeto.title} ». <span className="text-prune-doux">Il revient lundi.</span>
            </>
          ) : (
            <>Ton joker veto est disponible : un match retiré par semaine.</>
          )}
          <span className="block text-sm text-prune-doux">
            {partnerVeto ? `${partner?.display_name} a utilisé le sien sur « ${partnerVeto.title} ».` : `${partner?.display_name} a encore le sien.`}
          </span>
        </p>
      </div>

      {(error || actionError) && <Message kind="error">{error ?? actionError}</Message>}

      {!loading && todo.length === 0 && <EmptyState>Rien à regarder pour l’instant. Swipez un peu, ou ajoutez un film à la main.</EmptyState>}

      <ul className="flex flex-col gap-3">
        {todo.map((m) => (
          <MovieRow key={m.id} movie={m.movie}>
            {m.source === 'match' ? <MatchBadge /> : <span className="text-sm text-prune-doux">Ajouté par {nameOf(m.added_by) ?? 'vous'}</span>}
            <div className="mt-auto flex items-center gap-2">
              <button type="button" onClick={() => markSeen(m)} className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
                Vu
              </button>
              {m.source === 'manual' ? (
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
              ) : (
                // Un match obtenu à deux ne se retire qu'avec le veto (règle garantie par la base)
                !myVeto && (
                  <button type="button" onClick={() => veto(m)} className="min-h-11 rounded-full bg-lilas px-4 font-semibold text-prune-doux active:scale-95">
                    Veto
                  </button>
                )
              )}
            </div>
          </MovieRow>
        ))}
      </ul>

      <SearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Ajouter un film"
        label="Titre du film"
        existing={new Set(data.map((m) => m.item_id))}
        search={tmdb.search}
        onPick={addMovie}
      />
      <RatingSheet
        match={rating}
        mine={ratings.find((r) => r.match_id === rating?.id && r.user_id === me?.user_id)}
        onClose={() => setRating(null)}
      />
      {rouletteOpen && <Roulette movies={todo.map((m) => m.movie)} onClose={() => setRouletteOpen(false)} />}
    </>
  )
}
