import { useState, type FormEvent } from 'react'
import { Button, Field, Message, Overprint } from '../../components/ui'
import { frenchError, supabase } from '../../lib/supabase'

export function Connexion() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { data, error } =
      mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) return setMessage({ kind: 'error', text: frenchError(error) })
    // Si la confirmation par email est activée dans Supabase, pas de session tant que le lien n'est pas cliqué
    if (mode === 'signup' && !data.session) {
      setMessage({ kind: 'info', text: 'Compte créé. Clique sur le lien reçu par email, puis reviens te connecter ici.' })
      setMode('login')
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-5 py-10">
      <Overprint className="mx-auto h-44 w-64">
        <h1 className="text-6xl font-bold">Nous</h1>
        <p className="text-lg font-medium">rien que vous deux</p>
      </Overprint>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Mot de passe"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {message && <Message kind={message.kind}>{message.text}</Message>}
        <Button type="submit" disabled={busy}>
          {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login')
          setMessage(null)
        }}
        className="min-h-12 font-medium text-prune-doux underline underline-offset-4"
      >
        {mode === 'login' ? 'Première fois ? Créer un compte' : "J'ai déjà un compte"}
      </button>
    </main>
  )
}
