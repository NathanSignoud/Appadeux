import { useState } from 'react'
import { Button, Message, Overprint } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { ExpenseSheet, type ExpenseSheetState } from './ExpenseSheet'
import { Historique } from './Historique'
import { useBalance } from './hooks'
import { formatEuros } from './money'
import { Recap } from './Recap'

export function Depenses() {
  const { me, partner } = useAuth()
  const { expenses, settlements, cents, loading } = useBalance(me!.user_id)
  const [sheet, setSheet] = useState<ExpenseSheetState>(null)
  const [view, setView] = useState<'historique' | 'recap'>('historique')
  const [actionError, setActionError] = useState<string | null>(null)

  // cents > 0 : l'autre me doit
  const debtor = cents > 0 ? partner! : me!
  const creditor = cents > 0 ? me! : partner!
  const amount = Math.abs(cents)

  async function settle() {
    if (!confirm(`Enregistrer que ${debtor.display_name} a remboursé ${formatEuros(amount)} à ${creditor.display_name} ?`)) return
    const { error } = await supabase.from('settlements').insert({ from_user: debtor.user_id, to_user: creditor.user_id, amount_cents: amount })
    setActionError(error ? frenchError(error) : null)
  }

  const error = expenses.error ?? settlements.error ?? actionError

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Dépenses</h1>
        <button type="button" onClick={() => setSheet({})} className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
          Ajouter
        </button>
      </header>

      {!loading &&
        (amount === 0 ? (
          <Overprint className="h-40">
            <p className="text-5xl font-bold">Quittes</p>
            <p className="text-lg font-medium">Personne ne doit rien à personne.</p>
          </Overprint>
        ) : (
          <div className="blob flex flex-col items-center gap-3 bg-peche px-6 py-7 text-center">
            <p className="text-xl leading-snug font-medium">
              {debtor.display_name} doit
              <span className="block text-5xl leading-tight font-bold">{formatEuros(amount)}</span>à {creditor.display_name}
            </p>
            <Button variant="soft" onClick={settle}>
              On est quittes
            </Button>
          </div>
        ))}

      {error && <Message kind="error">{error}</Message>}

      <div role="group" aria-label="Affichage" className="flex gap-1 rounded-full bg-white p-1">
        {(
          [
            ['historique', 'Historique'],
            ['recap', 'Récap'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-full font-semibold transition-colors ${view === v ? 'bg-lilas-fonce text-prune' : 'text-prune-doux'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'historique' ? (
        <Historique expenses={expenses.data} settlements={settlements.data} loading={loading} onEdit={(expense) => setSheet({ expense })} onError={setActionError} />
      ) : (
        <Recap expenses={expenses.data} />
      )}

      <ExpenseSheet state={sheet} onClose={() => setSheet(null)} />
    </>
  )
}
