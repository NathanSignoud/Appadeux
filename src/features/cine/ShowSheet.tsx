import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Field, Message } from '../../components/ui'
import { frenchError, supabase } from '../../lib/supabase'
import type { ShowRow } from './hooks'

/** Corriger où on en est, marquer terminée, ou retirer la série. */
export function ShowSheet({ show, onClose }: { show: ShowRow | null; onClose: () => void }) {
  return (
    <Sheet open={show !== null} onClose={onClose} title={show?.show.name ?? 'Série'}>
      {show && <Form show={show} onClose={onClose} />}
    </Sheet>
  )
}

function Form({ show, onClose }: { show: ShowRow; onClose: () => void }) {
  const [season, setSeason] = useState(String(show.season))
  const [episode, setEpisode] = useState(String(show.episode))
  const [finished, setFinished] = useState(show.finished)
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase
      .from('shows')
      .update({ season: Number(season), episode: Number(episode), finished, updated_at: new Date().toISOString() })
      .eq('id', show.id)
    if (error) setError(frenchError(error))
    else onClose()
  }

  async function remove() {
    if (!confirm(`Retirer « ${show.show.name} » ? Les trahisons restent dans l’historique.`)) return
    const { error } = await supabase.from('shows').delete().eq('id', show.id)
    if (error) setError(frenchError(error))
    else onClose()
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Saison" type="number" inputMode="numeric" min={1} max={100} required value={season} onChange={(e) => setSeason(e.target.value)} />
        <Field label="Dernier épisode vu" type="number" inputMode="numeric" min={0} max={1000} required value={episode} onChange={(e) => setEpisode(e.target.value)} />
      </div>
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white px-4 font-medium">
        Série terminée
        <input type="checkbox" checked={finished} onChange={(e) => setFinished(e.target.checked)} className="size-6 accent-prune" />
      </label>
      {error && <Message kind="error">{error}</Message>}
      <Button type="submit">Enregistrer</Button>
      <Button type="button" variant="soft" onClick={remove}>
        Retirer la série
      </Button>
    </form>
  )
}
