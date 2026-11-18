import { useState, type FormEvent } from 'react'
import { Avatar, Button, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'

export function Parametres() {
  const { me, partner, inkOf, refresh } = useAuth()
  const [name, setName] = useState(me?.display_name ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)
  if (!me || !partner) return null

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.from('members').update({ display_name: name.trim() }).eq('user_id', me!.user_id)
    setBusy(false)
    if (error) return setMessage({ kind: 'error', text: frenchError(error) })
    setMessage({ kind: 'info', text: 'Prénom enregistré.' })
    await refresh()
  }

  return (
    <>
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <form onSubmit={save} className="flex flex-col gap-4 rounded-[28px] bg-white p-5">
        <Field label="Mon prénom" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} className="[&_input]:bg-lilas" />
        {message && <Message kind={message.kind}>{message.text}</Message>}
        <Button type="submit" disabled={busy || name.trim() === me.display_name}>
          Enregistrer le prénom
        </Button>
      </form>

      <section className="flex flex-col gap-3 rounded-[28px] bg-white p-5">
        <h2 className="text-lg font-semibold">Nos couleurs</h2>
        {[me, partner].map((m) => (
          <p key={m.user_id} className="flex items-center gap-3">
            <Avatar name={m.display_name} ink={inkOf(m.user_id)} />
            {m.display_name}
          </p>
        ))}
      </section>

      <Button variant="soft" onClick={() => supabase.auth.signOut()}>
        Se déconnecter
      </Button>
    </>
  )
}
