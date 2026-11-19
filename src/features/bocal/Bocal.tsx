import { useState, type FormEvent } from 'react'
import { Button, EmptyState, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { useJarStatus, useLoveNotes, type LoveNote } from './hooks'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
const PAPER = ['fill-peche', 'fill-menthe', 'fill-beurre', 'fill-encre-b/60', 'fill-encre-a/60']

/** Le bocal dessiné : un papier plié par mot qui attend (12 au plus). */
function Jar({ count, shaking }: { count: number; shaking: boolean }) {
  return (
    <svg viewBox="0 0 160 180" aria-hidden="true" className={`h-48 ${shaking ? 'animate-[shake_600ms_ease-in-out]' : ''}`}>
      <rect x="44" y="10" width="72" height="18" rx="6" className="fill-violet" />
      <path d="M40 34 C 30 40 22 60 22 90 L 24 150 C 25 166 135 166 136 150 L 138 90 C 138 60 130 40 120 34 Z" strokeWidth="4" className="fill-white/60 stroke-violet" />
      {Array.from({ length: Math.min(12, count) }, (_, i) => {
        const x = 38 + (i % 4) * 22 + (Math.floor(i / 4) % 2) * 9
        const y = 140 - Math.floor(i / 4) * 22
        return <rect key={i} x={x} y={y} width="20" height="13" rx="3" transform={`rotate(${(i * 37) % 50 - 25} ${x + 10} ${y + 6})`} className={PAPER[i % PAPER.length]} />
      })}
    </svg>
  )
}

export function Bocal() {
  const { me, partner } = useAuth()
  const { data: notes, error, reload } = useLoveNotes()
  const { status, reload: reloadStatus } = useJarStatus()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [drawn, setDrawn] = useState<LoveNote | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const received = notes.filter((n) => n.author_id !== me?.user_id) // déjà piochés (la RLS cache les autres)
  const mine = notes.filter((n) => n.author_id === me?.user_id)
  const waiting = status?.waiting ?? 0
  const canDraw = waiting > 0 && !status?.drawn_today

  async function shake() {
    setActionError(null)
    setShaking(true)
    const [{ data, error }] = await Promise.all([supabase.rpc('draw_love_note'), new Promise((r) => setTimeout(r, 650))])
    setShaking(false)
    if (error) return setActionError(frenchError(error))
    setDrawn(data)
    await Promise.all([reload(), reloadStatus()])
  }

  async function add(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('love_notes').insert({ body: body.trim() })
    setBusy(false)
    if (error) return setActionError(frenchError(error))
    setBody('')
  }

  async function remove(n: LoveNote) {
    if (!confirm('Retirer ce mot du bocal ?')) return
    const { error } = await supabase.from('love_notes').delete().eq('id', n.id)
    if (error) setActionError(frenchError(error))
  }

  return (
    <>
      <h1 className="text-3xl font-bold">Le bocal à mots doux</h1>
      {(error || actionError) && <Message kind="error">{error ?? actionError}</Message>}

      <section className="flex flex-col items-center gap-3 rounded-[32px] bg-white px-5 py-6 text-center">
        <Jar count={waiting} shaking={shaking} />
        <p className="text-lg font-medium">
          {waiting === 0
            ? `Aucun mot de ${partner?.display_name} dans le bocal pour l’instant.`
            : `${waiting} mot${waiting > 1 ? 's' : ''} de ${partner?.display_name} ${waiting > 1 ? 't’attendent' : 't’attend'}.`}
        </p>
        <Button onClick={shake} disabled={!canDraw || shaking}>
          Secouer le bocal
        </Button>
        {status?.drawn_today && <p className="text-prune-doux">Un mot par jour : prochaine pioche demain.</p>}
      </section>

      {drawn && (
        <figure className="flex flex-col gap-2 rounded-[28px_28px_28px_8px] bg-beurre p-5 motion-safe:animate-[pop_420ms_ease-out]">
          <blockquote className="text-xl leading-snug font-medium">« {drawn.body} »</blockquote>
          <figcaption className="text-prune-doux">
            {partner?.display_name}, le {shortDate(drawn.created_at)}
          </figcaption>
        </figure>
      )}

      <form onSubmit={add} className="flex flex-col gap-2">
        <label htmlFor="mot-doux" className="px-1 text-xl font-bold">
          Glisser un mot pour {partner?.display_name}
        </label>
        <textarea
          id="mot-doux"
          rows={3}
          maxLength={280}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="J’adore quand tu chantes faux en cuisinant"
          className="rounded-2xl bg-white p-4 text-lg outline-none focus-visible:ring-3 focus-visible:ring-violet"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="px-1 text-sm text-prune-doux">{280 - body.length} caractères restants. {partner?.display_name} ne le lira qu’en le piochant.</span>
          <Button type="submit" disabled={busy || !body.trim()}>
            Glisser
          </Button>
        </div>
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-xl font-bold">Mots piochés</h2>
        {received.length === 0 ? (
          <EmptyState>Les mots que tu pioches restent ici, pour les relire quand tu veux.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {received.map((n) => (
              <li key={n.id} className="rounded-2xl bg-white px-4 py-3">
                <p className="text-lg leading-snug">« {n.body} »</p>
                <p className="text-sm text-prune-doux">Pioché le {shortDate(n.drawn_at!)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xl font-bold">Mes mots pour {partner?.display_name}</h2>
          <ul className="flex flex-col gap-2">
            {mine.map((n) => (
              <li key={n.id} className="flex items-start gap-2 rounded-2xl bg-white px-4 py-3">
                <p className="flex-1 leading-snug">
                  « {n.body} »
                  <span className="block text-sm text-prune-doux">{n.drawn_at ? `Pioché le ${shortDate(n.drawn_at)}` : 'Encore dans le bocal'}</span>
                </p>
                {!n.drawn_at && (
                  <button type="button" onClick={() => remove(n)} className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-prune-doux active:scale-95">
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
