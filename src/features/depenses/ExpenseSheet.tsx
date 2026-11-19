import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Chip, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { dayKey } from '../../lib/dates'
import { frenchError, supabase } from '../../lib/supabase'
import { CATEGORIES, type Category, type Expense } from './hooks'
import { formatEuros, owedFor, parseEuros, type Split } from './money'

/** null = fermé ; {} = nouvelle dépense ; { expense } = modifier */
export type ExpenseSheetState = { expense?: Expense } | null

export function ExpenseSheet({ state, onClose }: { state: ExpenseSheetState; onClose: () => void }) {
  return (
    <Sheet open={state !== null} onClose={onClose} title={state?.expense ? 'Modifier la dépense' : 'Nouvelle dépense'}>
      {state && <Form expense={state.expense} onClose={onClose} />}
    </Sheet>
  )
}

const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')
const SPLITS: Record<Split, string> = { equal: '50/50', percent: 'En %', amount: 'En €' }

function Form({ expense, onClose }: { expense?: Expense; onClose: () => void }) {
  const { me, partner } = useAuth()
  const [amount, setAmount] = useState(expense ? centsToInput(expense.amount_cents) : '')
  const [label, setLabel] = useState(expense?.label ?? '')
  const [category, setCategory] = useState<Category>((expense?.category as Category) ?? 'courses')
  const [spentOn, setSpentOn] = useState(expense?.spent_on ?? dayKey(new Date()))
  const [paidBy, setPaidBy] = useState(expense?.paid_by ?? me!.user_id)
  // Une dépense existante qui n'est pas en 50/50 se rouvre « en € », avec la part exacte
  const wasEqual = !expense || expense.owed_cents === owedFor(expense.amount_cents, 'equal')
  const [split, setSplit] = useState<Split>(wasEqual ? 'equal' : 'amount')
  const [splitValue, setSplitValue] = useState(wasEqual ? '' : centsToInput(expense.owed_cents))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const people = [me!, partner!]
  const other = people.find((p) => p.user_id !== paidBy)!
  const payer = people.find((p) => p.user_id === paidBy)!
  const cents = parseEuros(amount)
  const value = split === 'percent' ? Number(splitValue.replace(',', '.')) : split === 'amount' ? parseEuros(splitValue) : 0
  const owed = cents === null || value === null || Number.isNaN(value) ? null : owedFor(cents, split, value)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (cents === null || cents <= 0) return setError('Montant invalide (exemple : 12,50).')
    if (owed === null) return setError(`La part de ${other.display_name} doit être comprise entre 0 et le montant total.`)
    setBusy(true)
    setError(null)
    const fields = { label: label.trim(), amount_cents: cents, owed_cents: owed, category, spent_on: spentOn, paid_by: paidBy }
    const { error } = expense ? await supabase.from('expenses').update(fields).eq('id', expense.id) : await supabase.from('expenses').insert(fields)
    setBusy(false)
    if (error) setError(frenchError(error))
    else onClose()
  }

  async function remove() {
    if (!expense || !confirm(`Supprimer « ${expense.label} » ?`)) return
    const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
    if (error) setError(frenchError(error))
    else onClose()
  }

  return (
    <form onSubmit={save} className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto pb-1">
      <div className="grid grid-cols-[1fr_1.4fr] gap-3">
        <Field label="Montant (€)" required inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        <Field label="Pour quoi ?" required maxLength={120} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Courses, resto…" />
      </div>

      <fieldset>
        <legend className="mb-2 px-1 font-medium text-prune-doux">Catégorie</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORIES) as Category[]).map((c) => (
            <Chip key={c} pressed={category === c} onClick={() => setCategory(c)}>
              {CATEGORIES[c]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Field label="Le" type="date" required value={spentOn} onChange={(e) => setSpentOn(e.target.value)} />

      <fieldset>
        <legend className="mb-2 px-1 font-medium text-prune-doux">Payé par</legend>
        <div className="flex gap-2">
          {people.map((p) => (
            <Chip key={p.user_id} pressed={paidBy === p.user_id} onClick={() => setPaidBy(p.user_id)} className="flex-1">
              {p.user_id === me!.user_id ? 'Moi' : p.display_name}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 px-1 font-medium text-prune-doux">Répartition</legend>
        <div className="flex gap-2">
          {(Object.keys(SPLITS) as Split[]).map((s) => (
            <Chip key={s} pressed={split === s} onClick={() => setSplit(s)} className="flex-1">
              {SPLITS[s]}
            </Chip>
          ))}
        </div>
        {split !== 'equal' && (
          <Field
            label={`Part de ${other.display_name} (${split === 'percent' ? '%' : '€'})`}
            required
            inputMode="decimal"
            autoComplete="off"
            value={splitValue}
            onChange={(e) => setSplitValue(e.target.value)}
            placeholder={split === 'percent' ? '40' : '0,00'}
          />
        )}
        {cents !== null && owed !== null && (
          <p className="rounded-2xl bg-white px-4 py-3">
            {owed === 0
              ? `${payer.display_name} paie tout, personne ne doit rien.`
              : `${other.display_name} doit ${formatEuros(owed)} à ${payer.display_name} pour cette dépense.`}
          </p>
        )}
      </fieldset>

      {error && <Message kind="error">{error}</Message>}
      <Button type="submit" disabled={busy}>
        {expense ? 'Enregistrer' : 'Ajouter la dépense'}
      </Button>
      {expense && (
        <Button type="button" variant="soft" onClick={remove}>
          Supprimer
        </Button>
      )}
    </form>
  )
}
