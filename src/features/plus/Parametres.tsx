import { useEffect, useState, type FormEvent } from 'react'
import { Avatar, Button, Chip, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { imageUrl, tmdb, type Provider } from '../../lib/tmdb'

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

      <Abonnements />

      <MotDePasse />

      <Button variant="soft" onClick={() => supabase.auth.signOut()}>
        Se déconnecter
      </Button>

      {/* Mention exigée par les conditions d'utilisation de l'API TMDB */}
      <p className="px-2 text-sm text-prune-doux">
        Les infos sur les films viennent de{' '}
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          TMDB
        </a>
        . Cette app utilise l’API TMDB mais n’est ni approuvée ni certifiée par TMDB.
      </p>
    </>
  )
}

function MotDePasse() {
  const { session } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) return setMessage({ kind: 'error', text: 'Les deux mots de passe ne sont pas identiques.' })
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setMessage({ kind: 'error', text: frenchError(error) })
    setPassword('')
    setConfirm('')
    setMessage({ kind: 'info', text: 'Mot de passe changé. Utilise-le à ta prochaine connexion.' })
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-[28px] bg-white p-5">
      <h2 className="text-lg font-semibold">Mon mot de passe</h2>
      <p className="text-prune-doux">Compte : {session?.user.email}</p>
      {/* champ email caché : aide les gestionnaires de mots de passe à associer le nouveau mot de passe au bon compte */}
      <input type="email" autoComplete="username" value={session?.user.email ?? ''} readOnly hidden />
      <Field label="Nouveau mot de passe" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="[&_input]:bg-lilas" />
      <Field label="Encore une fois" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="[&_input]:bg-lilas" />
      {message && <Message kind={message.kind}>{message.text}</Message>}
      <Button type="submit" disabled={busy}>
        Changer mon mot de passe
      </Button>
    </form>
  )
}

/** Nos abonnements streaming : servent au filtre « Seulement sur nos abonnements » du ciné. */
function Abonnements() {
  const { me, providers, refresh } = useAuth()
  const [list, setList] = useState<Provider[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    tmdb
      .providers()
      .then((r) => setList(r.providers))
      .catch((e: Error) => setError(e.message))
  }, [])

  async function toggle(id: number) {
    const next = providers.includes(id) ? providers.filter((p) => p !== id) : [...providers, id]
    const { error } = await supabase.from('couples').update({ streaming_providers: next }).eq('id', me!.couple_id)
    if (error) setError(frenchError(error))
    else await refresh()
  }

  return (
    <section className="flex flex-col gap-3 rounded-[28px] bg-white p-5">
      <h2 className="text-lg font-semibold">Nos abonnements</h2>
      <p className="text-prune-doux">Pour ne swiper que des films disponibles chez vous. Commun à vous deux.</p>
      {error && <Message kind="error">{error}</Message>}
      {!list && !error && <p className="text-prune-doux">Chargement des plateformes…</p>}
      <div className="flex flex-wrap gap-2">
        {list?.map((p) => (
          <Chip key={p.id} pressed={providers.includes(p.id)} onClick={() => toggle(p.id)} className="flex items-center gap-2 pl-1.5 [&:not([aria-pressed=true])]:bg-lilas">
            <img src={imageUrl(p.logoPath, 'w92')!} alt="" className="size-8 rounded-full" />
            {p.name}
          </Chip>
        ))}
      </div>
    </section>
  )
}
