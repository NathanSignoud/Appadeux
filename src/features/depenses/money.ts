// Logique d'argent, pure et testée (tests/depenses.test.ts). Tout est en centimes.

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
/** 1250 → « 12,50 € » */
export const formatEuros = (cents: number) => euros.format(cents / 100)

/** « 12 », « 12,5 », « 12.50 », « 1 234,56 » → centimes ; null si ce n'est pas un montant. */
export function parseEuros(input: string): number | null {
  const s = input.replace(/[\s €]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  return Math.round(Number(s) * 100)
}

export type Split = 'equal' | 'percent' | 'amount'

/**
 * Part due par celui qui n'a PAS payé.
 * equal : la moitié (le centime impair reste à celui qui a payé l'autre moitié, arrondi au plus proche) ;
 * percent : value = % de l'autre ; amount : value = centimes de l'autre. null si hors bornes.
 */
export function owedFor(amount: number, split: Split, value = 0): number | null {
  const owed = split === 'equal' ? Math.round(amount / 2) : split === 'percent' ? Math.round((amount * value) / 100) : value
  return Number.isInteger(owed) && owed >= 0 && owed <= amount ? owed : null
}

type ExpenseLike = { paid_by: string; owed_cents: number }
type SettlementLike = { from_user: string; to_user: string; amount_cents: number }

/** Solde vu par `me` : > 0 l'autre me doit ce montant, < 0 je le dois, 0 quittes. */
export function balance(expenses: ExpenseLike[], settlements: SettlementLike[], me: string): number {
  let n = 0
  for (const e of expenses) n += e.paid_by === me ? e.owed_cents : -e.owed_cents
  for (const s of settlements) n += s.from_user === me ? s.amount_cents : -s.amount_cents
  return n
}
