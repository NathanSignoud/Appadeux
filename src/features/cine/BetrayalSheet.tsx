import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Chip, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import type { ShowRow } from './hooks'

/** Déclarer une trahison : avouer (moi) ou dénoncer (l'autre). */
export function BetrayalSheet({ show, onClose }: { show: ShowRow | null; onClose: () => void }) {
  return (
    <Sheet open={show !== null} onClose={onClose} title="Trahison !">
      {show && <Form show={show} onClose={onClose} />}
    </Sheet>
  )
}

function Form({ show, onClose }: { show: ShowRow; onClose: () => void }) {
  const { me, partner } = useAuth()
  const [traitor, setTraitor] = useState(partner!.user_id)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase
      .from('betrayals')
      .insert({ show_id: show.id, show_name: show.show.name, traitor_id: traitor, note: note.trim() || null })
    setBusy(false)
    if (error) setError(frenchError(error))
    else onClose()
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-lg">Quelqu’un a avancé dans « {show.show.name} » sans l’autre ?</p>
      <div className="flex gap-2">
        <Chip pressed={traitor === partner!.user_id} onClick={() => setTraitor(partner!.user_id)} className="flex-1">
          Je dénonce {partner!.display_name}
        </Chip>
        <Chip pressed={traitor === me!.user_id} onClick={() => setTraitor(me!.user_id)} className="flex-1">
          J’avoue
        </Chip>
      </div>
      <Field label="Circonstances (facultatif)" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Deux épisodes dans le train" />
      {error && <Message kind="error">{error}</Message>}
      <Button type="submit" disabled={busy}>
        Enregistrer la trahison
      </Button>
    </form>
  )
}
