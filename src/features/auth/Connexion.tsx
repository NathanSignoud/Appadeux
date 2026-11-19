import { useState, type FormEvent } from 'react'
import { Button, Field, Message, Overprint } from '../../components/ui'
import { frenchError, supabase } from '../../lib/supabase'

// Connexion seulement : les inscriptions sont fermées côté Supabase (les deux comptes existent).
export function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(frenchError(error))
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Message kind="error">{error}</Message>}
        <Button type="submit" disabled={busy}>
          Se connecter
        </Button>
      </form>
    </main>
  )
}
