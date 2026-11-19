import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { Button, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import type { List } from './hooks'

/** Créer une liste (partagée ou secrète) ou renommer / supprimer une liste existante. */
export function ListSheet({ open, list, onClose }: { open: boolean; list?: List; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={list ? 'Modifier la liste' : 'Nouvelle liste'}>
      <Form list={list} onClose={onClose} />
    </Sheet>
  )
}

function Form({ list, onClose }: { list?: List; onClose: () => void }) {
  const { me } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState(list?.title ?? '')
  const [secret, setSecret] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    if (list) {
      const { error } = await supabase.from('lists').update({ title: title.trim() }).eq('id', list.id)
      setBusy(false)
      if (error) return setError(frenchError(error))
      return onClose()
    }
    const { data, error } = await supabase
      .from('lists')
      .insert({ title: title.trim(), owner_id: secret ? me!.user_id : null })
      .select('id')
      .single()
    setBusy(false)
    if (error) return setError(frenchError(error))
    onClose()
    navigate(`/listes/${data.id}`)
  }

  async function remove() {
    if (!list || !confirm(`Supprimer la liste « ${list.title} » et tout son contenu ?`)) return
    const { error } = await supabase.from('lists').delete().eq('id', list.id)
    if (error) return setError(frenchError(error))
    onClose()
    navigate('/listes')
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Field label="Nom" required maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Courses, à faire, envies…" />
      {!list && (
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2 font-medium">
          <span>
            Secrète
            <span className="block text-sm text-prune-doux">Visible seulement par toi, même pas par l’autre</span>
          </span>
          <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} className="size-6 shrink-0 accent-prune" />
        </label>
      )}
      {error && <Message kind="error">{error}</Message>}
      <Button type="submit" disabled={busy}>
        {list ? 'Enregistrer' : 'Créer la liste'}
      </Button>
      {list && (
        <Button type="button" variant="soft" onClick={remove}>
          Supprimer la liste
        </Button>
      )}
    </form>
  )
}
