import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Chip, EmptyState, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { CouponCard } from './CouponCard'
import { useCoupons, type Coupon, type CouponLook } from './hooks'
import { ScratchCard } from './ScratchCard'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

export function Bons() {
  const { me, partner } = useAuth()
  const { data: coupons, loading, error } = useCoupons()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  if (!me || !partner) return null

  const forMe = coupons.filter((c) => c.giver_id !== me.user_id)
  const toScratch = forMe.filter((c) => !c.scratched_at)
  const toUse = forMe.filter((c) => c.scratched_at && !c.used_at)
  const used = forMe.filter((c) => c.used_at)
  const given = coupons.filter((c) => c.giver_id === me.user_id)

  async function update(c: Coupon, fields: Partial<Pick<Coupon, 'scratched_at' | 'used_at'>>) {
    const { error } = await supabase.from('coupons').update(fields).eq('id', c.id)
    setActionError(error ? frenchError(error) : null)
  }

  async function takeBack(c: Coupon) {
    if (!confirm(`Reprendre le bon « ${c.title} » ?`)) return
    const { error } = await supabase.from('coupons').delete().eq('id', c.id)
    setActionError(error ? frenchError(error) : null)
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Bons à gratter</h1>
        <button type="button" onClick={() => setSheetOpen(true)} className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
          Offrir
        </button>
      </header>
      {(error || actionError) && <Message kind="error">{error ?? actionError}</Message>}

      {!loading && forMe.length === 0 && (
        <EmptyState>Pas encore de bon de {partner.display_name}. En attendant, tu peux en offrir un : petit-déj au lit, joker dispute, choix du resto…</EmptyState>
      )}

      {toScratch.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xl font-bold">À gratter</h2>
          {toScratch.map((c) => (
            <ScratchCard key={c.id} onReveal={() => update(c, { scratched_at: new Date().toISOString() })}>
              <CouponCard coupon={c} from={partner.display_name} />
            </ScratchCard>
          ))}
        </section>
      )}

      {toUse.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xl font-bold">Mon carnet</h2>
          {toUse.map((c) => (
            <CouponCard key={c.id} coupon={c} from={partner.display_name}>
              <button
                type="button"
                onClick={() => confirm(`Utiliser le bon « ${c.title} » maintenant ?`) && update(c, { used_at: new Date().toISOString() })}
                className="mt-2 min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95"
              >
                Utiliser ce bon
              </button>
            </CouponCard>
          ))}
        </section>
      )}

      {given.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xl font-bold">Offerts à {partner.display_name}</h2>
          <ul className="flex flex-col gap-2">
            {given.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                <p className="flex-1 leading-snug">
                  <span className="font-semibold">{c.title}</span>
                  <span className="block text-sm text-prune-doux">
                    {c.used_at ? `Utilisé le ${shortDate(c.used_at)}` : c.scratched_at ? 'Gratté, pas encore utilisé' : 'Pas encore gratté'}
                  </span>
                </p>
                {!c.used_at && (
                  <button type="button" onClick={() => takeBack(c)} className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-prune-doux active:scale-95">
                    Reprendre
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {used.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xl font-bold">Déjà utilisés</h2>
          {used.slice(0, 10).map((c) => (
            <CouponCard key={c.id} coupon={c} from={partner.display_name} dimmed>
              <span className="text-sm font-semibold">Utilisé le {shortDate(c.used_at!)}</span>
            </CouponCard>
          ))}
        </section>
      )}

      <CouponSheet open={sheetOpen} onClose={() => setSheetOpen(false)} partnerName={partner.display_name} myName={me.display_name} />
    </>
  )
}

const LOOK_LABELS: Record<CouponLook, string> = { peche: 'Pêche', menthe: 'Menthe', beurre: 'Beurre', violet: 'Violet' }

function CouponSheet({ open, onClose, partnerName, myName }: { open: boolean; onClose: () => void; partnerName: string; myName: string }) {
  return (
    <Sheet open={open} onClose={onClose} title={`Un bon pour ${partnerName}`}>
      <CouponForm onClose={onClose} myName={myName} partnerName={partnerName} />
    </Sheet>
  )
}

function CouponForm({ onClose, myName, partnerName }: { onClose: () => void; myName: string; partnerName: string }) {
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [look, setLook] = useState<CouponLook>('peche')
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('coupons').insert({ title: title.trim(), details: details.trim() || null, look })
    if (error) setError(frenchError(error))
    else onClose()
  }

  return (
    <form onSubmit={save} className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto pb-1">
      <Field label="Bon pour…" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="un petit-déj au lit" />
      <Field label="Précisions (facultatif)" maxLength={300} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Valable un dimanche, croissants compris" />
      <fieldset>
        <legend className="mb-2 px-1 font-medium text-prune-doux">Couleur</legend>
        <div className="flex gap-2">
          {(Object.keys(LOOK_LABELS) as CouponLook[]).map((l) => (
            <Chip key={l} pressed={look === l} onClick={() => setLook(l)} className="flex-1 px-2">
              {LOOK_LABELS[l]}
            </Chip>
          ))}
        </div>
      </fieldset>
      <CouponCard coupon={{ title: title || '…', details: details || null, look }} from={myName} />
      <p className="px-1 text-prune-doux">Il arrivera caché sous une couche à gratter chez {partnerName}.</p>
      {error && <Message kind="error">{error}</Message>}
      <Button type="submit">Offrir le bon</Button>
    </form>
  )
}
