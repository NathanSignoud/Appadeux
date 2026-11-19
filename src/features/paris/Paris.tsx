import { useState, type FormEvent, type ReactNode } from 'react'
import { Sheet } from '../../components/Sheet'
import { Avatar, Button, EmptyState, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { useBets, type Bet } from './hooks'

export function Paris() {
  const { me, partner, members, inkOf } = useAuth()
  const { data: bets, loading, error } = useBets()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  if (!me || !partner) return null
  const nameOf = (id: string) => (id === me.user_id ? 'Toi' : (members.find((m) => m.user_id === id)?.display_name ?? '?'))

  const toAnswer = bets.filter((b) => b.status === 'proposed' && b.created_by !== me.user_id)
  const pending = bets.filter((b) => b.status === 'proposed' && b.created_by === me.user_id)
  const running = bets.filter((b) => b.status === 'accepted' && !b.winner_id)
  const owedToMe = bets.filter((b) => b.winner_id === me.user_id && !b.honored_at)
  const iOwe = bets.filter((b) => b.winner_id === partner.user_id && !b.honored_at)
  const history = bets.filter((b) => b.status === 'refused' || b.honored_at)

  async function update(b: Bet, fields: Partial<Pick<Bet, 'status' | 'winner_id' | 'honored_at'>>, question?: string) {
    if (question && !confirm(question)) return
    const { error } = await supabase.from('bets').update(fields).eq('id', b.id)
    setActionError(error ? frenchError(error) : null)
  }

  async function remove(b: Bet) {
    if (!confirm('Retirer ce pari ?')) return
    const { error } = await supabase.from('bets').delete().eq('id', b.id)
    setActionError(error ? frenchError(error) : null)
  }

  const card = (b: Bet, actions?: ReactNode, note?: string) => (
    <li key={b.id} className="flex flex-col gap-2 rounded-[24px] bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar name={nameOf(b.created_by)} ink={inkOf(b.created_by)} />
        <p className="flex-1 leading-snug">
          <span className="font-semibold">{b.created_by === me.user_id ? 'Tu paries' : `${nameOf(b.created_by)} parie`} que</span> {b.claim}
          <span className="block text-prune-doux">Gage : {b.stake}</span>
          {note && <span className="block text-sm text-prune-doux">{note}</span>}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </li>
  )

  const small = (label: string, onClick: () => void, primary = false) => (
    <button key={label} type="button" onClick={onClick} className={`min-h-11 flex-1 rounded-full px-4 font-semibold active:scale-95 ${primary ? 'bg-prune text-white' : 'bg-lilas text-prune'}`}>
      {label}
    </button>
  )

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Paris et gages</h1>
        <button type="button" onClick={() => setSheetOpen(true)} className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
          Parier
        </button>
      </header>
      {(error || actionError) && <Message kind="error">{error ?? actionError}</Message>}

      {/* Le registre des gages dus */}
      <section className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 rounded-[24px_24px_24px_8px] bg-menthe p-4">
          <span className="font-medium">{partner.display_name} te doit</span>
          {owedToMe.length === 0 ? <span className="text-prune-doux">rien du tout</span> : owedToMe.map((b) => <span key={b.id} className="leading-tight font-semibold">{b.stake}</span>)}
        </div>
        <div className="flex flex-col gap-1 rounded-[24px_24px_8px_24px] bg-peche p-4">
          <span className="font-medium">Tu dois à {partner.display_name}</span>
          {iOwe.length === 0 ? <span className="text-prune-doux">rien du tout</span> : iOwe.map((b) => <span key={b.id} className="leading-tight font-semibold">{b.stake}</span>)}
        </div>
      </section>

      {!loading && bets.length === 0 && <EmptyState>Aucun pari pour l’instant. « Je parie que tu t’endors avant la fin du film »… À toi de lancer le premier.</EmptyState>}

      {toAnswer.length > 0 && (
        <Section title="À toi de répondre">
          {toAnswer.map((b) => card(b, <>{small('Pari tenu', () => update(b, { status: 'accepted' }), true)}{small('Non merci', () => update(b, { status: 'refused' }))}</>))}
        </Section>
      )}

      {owedToMe.length + iOwe.length > 0 && (
        <Section title="Gages à honorer">
          {owedToMe.map((b) => card(b, small('Gage honoré', () => update(b, { honored_at: new Date().toISOString() }, `${partner.display_name} a bien honoré « ${b.stake} » ?`), true), `Gagné par toi, ${partner.display_name} te doit le gage.`))}
          {iOwe.map((b) => card(b, undefined, `Gagné par ${partner.display_name} : c’est à ${partner.display_name} de confirmer quand le gage est honoré.`))}
        </Section>
      )}

      {running.length > 0 && (
        <Section title="En cours">
          {running.map((b) =>
            card(
              b,
              [me, partner].map((m) => small(`${m.user_id === me.user_id ? 'J’ai' : `${m.display_name} a`} gagné`, () => update(b, { winner_id: m.user_id }, `${nameOf(m.user_id)} a gagné ce pari ?`))),
            ),
          )}
        </Section>
      )}

      {pending.length > 0 && (
        <Section title={`En attente de ${partner.display_name}`}>
          {pending.map((b) => card(b, small('Retirer', () => remove(b))))}
        </Section>
      )}

      {history.length > 0 && (
        <Section title="Historique">
          {history.slice(0, 10).map((b) =>
            card(b, undefined, b.status === 'refused' ? 'Refusé' : `Gagné par ${nameOf(b.winner_id!)}, gage honoré le ${new Date(b.honored_at!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`),
          )}
        </Section>
      )}

      <BetSheet open={sheetOpen} onClose={() => setSheetOpen(false)} partnerName={partner.display_name} />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xl font-bold">{title}</h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

function BetSheet({ open, onClose, partnerName }: { open: boolean; onClose: () => void; partnerName: string }) {
  return (
    <Sheet open={open} onClose={onClose} title="Nouveau pari">
      <BetForm onClose={onClose} partnerName={partnerName} />
    </Sheet>
  )
}

function BetForm({ onClose, partnerName }: { onClose: () => void; partnerName: string }) {
  const [claim, setClaim] = useState('')
  const [stake, setStake] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('bets').insert({ claim: claim.trim(), stake: stake.trim() })
    if (error) setError(frenchError(error))
    else onClose()
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Field label="Je parie que…" required maxLength={200} value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="tu t’endors avant la fin du film" />
      <Field label="Le perdant offre…" required maxLength={120} value={stake} onChange={(e) => setStake(e.target.value)} placeholder="un massage, la vaisselle, le prochain resto" />
      <p className="px-1 text-prune-doux">{partnerName} doit accepter le pari pour qu’il compte.</p>
      {error && <Message kind="error">{error}</Message>}
      <Button type="submit">Lancer le pari</Button>
    </form>
  )
}
