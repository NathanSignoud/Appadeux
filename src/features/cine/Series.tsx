import { useState } from 'react'
import { Avatar, Button, EmptyState, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { imageUrl, tmdb, type SearchResult } from '../../lib/tmdb'
import { BetrayalSheet } from './BetrayalSheet'
import { useBetrayals, useShows, type Betrayal, type ShowRow } from './hooks'
import { SearchSheet } from './SearchSheet'
import { ShowSheet } from './ShowSheet'
import { nextEpisode } from './stats'

async function addShow(r: SearchResult) {
  const show = await tmdb.tv(r.id) // saisons et épisodes, pour avancer tout seul
  const { error } = await supabase.from('shows').insert({ tmdb_id: r.id, payload: show })
  return error ? (error.code === '23505' ? 'Cette série est déjà suivie.' : frenchError(error)) : null
}

// Petit historique moqueur : une phrase choisie selon l'id (stable d'un affichage à l'autre)
const TEASES = [
  (n: string, s: string) => `${n} a regardé ${s} en douce. La confiance est rompue.`,
  (n: string, s: string) => `${n} a pris de l’avance sur ${s}. Un seul spoiler et c’est le canapé.`,
  (n: string, s: string) => `Alerte : ${n} a continué ${s} sans attendre. Impardonnable, ou presque.`,
  (n: string, s: string) => `${n} et ${s}, une belle histoire… sans toi.`,
  (n: string, s: string) => `${n} jure que c’était « juste un épisode » de ${s}. Bien sûr.`,
]
const tease = (b: Betrayal, name: string) => TEASES[parseInt(b.id.slice(0, 6), 16) % TEASES.length](name, b.show_name)

export function Series() {
  const { me, members, inkOf } = useAuth()
  const { data: shows, loading, error } = useShows()
  const { data: betrayals } = useBetrayals()
  const [searchOpen, setSearchOpen] = useState(false)
  const [editing, setEditing] = useState<ShowRow | null>(null)
  const [betraying, setBetraying] = useState<ShowRow | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const nameOf = (id: string) => members.find((m) => m.user_id === id)?.display_name ?? '?'

  const current = shows.filter((s) => !s.finished)
  const finished = shows.filter((s) => s.finished)

  async function advance(s: ShowRow) {
    const next = nextEpisode(s.show.seasons, s.season, s.episode)
    const fields = next ? { ...next, updated_at: new Date().toISOString() } : { finished: true, updated_at: new Date().toISOString() }
    if (!next && !confirm(`C’était le dernier épisode connu de « ${s.show.name} ». La marquer comme terminée ?`)) return
    const { error } = await supabase.from('shows').update(fields).eq('id', s.id)
    setActionError(error ? frenchError(error) : null)
  }

  async function forgive(b: Betrayal) {
    if (!confirm('Pardonner et effacer cette trahison ?')) return
    const { error } = await supabase.from('betrayals').delete().eq('id', b.id)
    setActionError(error ? frenchError(error) : null)
  }

  const showCard = (s: ShowRow) => {
    const poster = imageUrl(s.show.posterPath, 'w185')
    const count = betrayals.filter((b) => b.show_id === s.id).length
    return (
      <li key={s.id} className="flex gap-3 rounded-[28px] bg-white p-3">
        {poster ? <img src={poster} alt="" loading="lazy" className="h-28 w-[4.7rem] shrink-0 rounded-2xl object-cover" /> : <span aria-hidden="true" className="h-28 w-[4.7rem] shrink-0 rounded-2xl bg-lilas-fonce" />}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <button type="button" onClick={() => setEditing(s)} className="text-left text-lg leading-tight font-semibold underline-offset-4 active:underline">
            {s.show.name}
          </button>
          <p className="text-prune-doux">
            {s.finished ? 'Terminée' : s.episode === 0 ? `Saison ${s.season} pas commencée` : `Saison ${s.season}, épisode ${s.episode}`}
            {count > 0 && `, ${count} trahison${count > 1 ? 's' : ''}`}
          </p>
          {!s.finished && (
            <div className="mt-auto flex items-center gap-2">
              <button type="button" onClick={() => advance(s)} className="min-h-11 rounded-full bg-prune px-4 font-semibold text-white active:scale-95">
                +1 épisode
              </button>
              <button type="button" onClick={() => setBetraying(s)} className="min-h-11 rounded-full bg-lilas px-4 font-semibold text-prune-doux active:scale-95">
                Trahison !
              </button>
            </div>
          )}
        </div>
      </li>
    )
  }

  return (
    <>
      <Button variant="soft" onClick={() => setSearchOpen(true)}>
        Suivre une série
      </Button>
      {(error || actionError) && <Message kind="error">{error ?? actionError}</Message>}

      {/* Le compteur de trahisons */}
      <section className="flex flex-col gap-3 rounded-[28px] bg-white p-4">
        <h2 className="text-xl font-bold">Compteur de trahisons</h2>
        <ul className="grid grid-cols-2 gap-2">
          {members.map((m) => (
            <li key={m.user_id} className={`flex items-center gap-3 rounded-[22px] p-3 ${inkOf(m.user_id) === 'a' ? 'bg-encre-a/25' : 'bg-encre-b/25'}`}>
              <Avatar name={m.display_name} ink={inkOf(m.user_id)} />
              <span className="flex flex-col leading-tight">
                <span className="text-3xl font-bold">{betrayals.filter((b) => b.traitor_id === m.user_id).length}</span>
                <span className="text-sm text-prune-doux">{m.user_id === me?.user_id ? 'toi' : m.display_name}</span>
              </span>
            </li>
          ))}
        </ul>
        {betrayals.length === 0 ? (
          <p className="text-prune-doux">Aucune trahison. Pour l’instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {betrayals.slice(0, 8).map((b) => (
              <li key={b.id} className="flex items-start gap-2 rounded-2xl bg-lilas px-3 py-2">
                <p className="flex-1 leading-snug">
                  {tease(b, nameOf(b.traitor_id))}
                  {b.note && <span className="block text-prune-doux">« {b.note} »</span>}
                  <span className="block text-sm text-prune-doux">
                    {b.reported_by === b.traitor_id ? 'Aveu spontané' : `Dénonciation de ${nameOf(b.reported_by)}`}, le {new Date(b.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </p>
                {b.reported_by === me?.user_id && (
                  <button type="button" onClick={() => forgive(b)} className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-prune-doux active:scale-95">
                    Pardonner
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!loading && shows.length === 0 && <EmptyState>Aucune série suivie. Ajoutez celle que vous regardez ensemble pour savoir où vous en êtes.</EmptyState>}

      <ul className="flex flex-col gap-3">{current.map(showCard)}</ul>
      {finished.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xl font-bold">Terminées</h2>
          <ul className="flex flex-col gap-3 opacity-80">{finished.map(showCard)}</ul>
        </section>
      )}

      <SearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Suivre une série"
        label="Titre de la série"
        existing={new Set(shows.map((s) => String(s.tmdb_id)))}
        search={tmdb.searchTv}
        onPick={addShow}
      />
      <ShowSheet show={editing} onClose={() => setEditing(null)} />
      <BetrayalSheet show={betraying} onClose={() => setBetraying(null)} />
    </>
  )
}
