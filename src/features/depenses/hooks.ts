import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useLiveQuery } from '../../lib/useLiveQuery'
import { balance } from './money'

export type Expense = Tables<'expenses'>
export type Settlement = Tables<'settlements'>
export type Category = 'courses' | 'resto' | 'sorties' | 'maison' | 'voyage' | 'transport' | 'cadeaux' | 'autre'

// Même liste que la contrainte SQL de expenses.category
export const CATEGORIES: Record<Category, string> = {
  courses: 'Courses',
  resto: 'Restos',
  sorties: 'Sorties',
  maison: 'Maison',
  voyage: 'Voyages',
  transport: 'Transport',
  cadeaux: 'Cadeaux',
  autre: 'Autre',
}

// shortcut: tout l'historique est chargé ; paginer si on dépasse quelques milliers de dépenses.
export function useExpenses() {
  return useLiveQuery(['expenses'], () => supabase.from('expenses').select('*').order('spent_on', { ascending: false }).order('created_at', { ascending: false }))
}

export function useSettlements() {
  return useLiveQuery(['settlements'], () => supabase.from('settlements').select('*').order('created_at', { ascending: false }))
}

/** Solde vu par moi : > 0 l'autre me doit, < 0 je dois. */
export function useBalance(me: string) {
  const expenses = useExpenses()
  const settlements = useSettlements()
  return {
    expenses,
    settlements,
    cents: balance(expenses.data, settlements.data, me),
    loading: expenses.loading || settlements.loading,
  }
}
