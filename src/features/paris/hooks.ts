import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useLiveQuery } from '../../lib/useLiveQuery'

export type Bet = Tables<'bets'>

export function useBets() {
  return useLiveQuery(['bets'], () => supabase.from('bets').select('*').order('created_at', { ascending: false }))
}
