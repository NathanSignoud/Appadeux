import { useState, type FormEvent } from 'react'
import { Button, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'

/** Avant d'entrer dans l'app : créer le couple, le rejoindre avec un code, ou attendre l'autre. */
export function Bienvenue() {
  const { me, inviteCode, refresh } = useAuth()
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5 py-10">
      {me ? <Attente name={me.display_name} code={inviteCode} /> : <Choix onDone={refresh} />}
      <button type="button" onClick={() => supabase.auth.signOut()} className="min-h-12 font-medium text-prune-doux underline underline-offset-4">
        Se déconnecter
      </button>
    </main>
  )
}

function Choix({ onDone }: { onDone: () => Promise<void> }) {
  const [step, setStep] = useState<'choix' | 'rejoindre'>('choix')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } =
      step === 'choix'
        ? await supabase.rpc('create_couple', { p_display_name: name })
        : await supabase.rpc('join_couple', { p_code: code, p_display_name: name })
    if (error) {
      setError(frenchError(error))
      setBusy(false)
      return
    }
    await onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="blob-alt grid h-40 place-items-center bg-peche px-8 text-center">
        <h1 className="text-3xl font-bold">Bienvenue !</h1>
      </div>
      <Field label="Ton prénom" autoComplete="given-name" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} />

      {step === 'rejoindre' && (
        <Field
          label="Code d'invitation (8 caractères)"
          autoCapitalize="characters"
          autoComplete="off"
          minLength={8}
          maxLength={8}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="[&_input]:tracking-[0.3em]"
        />
      )}
      {error && <Message kind="error">{error}</Message>}

      {step === 'choix' ? (
        <>
          <Button type="submit" disabled={busy}>
            Créer notre couple
          </Button>
          <Button type="button" variant="soft" onClick={() => setStep('rejoindre')}>
            J'ai un code d'invitation
          </Button>
        </>
      ) : (
        <>
          <Button type="submit" disabled={busy}>
            Rejoindre
          </Button>
          <Button type="button" variant="soft" onClick={() => setStep('choix')}>
            Retour
          </Button>
        </>
      )}
    </form>
  )
}

function Attente({ name, code }: { name: string; code: string | null }) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator.share === 'function'

  async function copy() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
  }

  return (
    <div className="flex flex-col gap-5 text-center">
      <h1 className="text-3xl font-bold">C'est noté, {name} !</h1>
      <p className="text-lg text-prune-doux">Donne ce code à ta moitié. Dès qu'il est saisi, l'app s'ouvre pour vous deux.</p>
      <p className="blob grid h-36 place-items-center bg-white text-4xl font-bold tracking-[0.25em]" aria-label={`Code d'invitation : ${code ?? ''}`}>
        {code}
      </p>
      {canShare ? (
        <Button onClick={() => navigator.share({ text: `Rejoins-moi sur Nous avec le code ${code}` }).catch(() => {})}>Envoyer le code</Button>
      ) : (
        <Button onClick={copy}>{copied ? 'Code copié' : 'Copier le code'}</Button>
      )}
    </div>
  )
}
