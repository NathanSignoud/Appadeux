import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useLiveQuery } from '../../lib/useLiveQuery'

export type List = Tables<'lists'>
export type ListItem = Tables<'list_items'>

/** Toutes les listes que je peux voir (les secrètes de l'autre sont filtrées par la RLS), avec l'état de leurs éléments. */
export function useLists() {
  return useLiveQuery(['lists', 'list_items'], () => supabase.from('lists').select('*, list_items(done)').order('created_at'))
}

/** Une liste et ses éléments dans l'ordre manuel. Tableau vide si elle n'existe pas (ou plus). */
export function useList(id: string) {
  return useLiveQuery(['lists', 'list_items'], () =>
    supabase.from('lists').select('*, list_items(*)').eq('id', id).order('position', { referencedTable: 'list_items' }),
  )
}

export const remaining = (list: { list_items: { done: boolean }[] }) => list.list_items.filter((i) => !i.done).length
