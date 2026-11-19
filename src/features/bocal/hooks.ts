import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useLiveQuery } from '../../lib/useLiveQuery'

export type LoveNote = Tables<'love_notes'>

/** Mes mots (piochés ou non) + ceux de l'autre que j'ai déjà piochés : la RLS cache le reste. */
export function useLoveNotes() {
  return useLiveQuery(['love_notes'], () => supabase.from('love_notes').select('*').order('created_at', { ascending: false }))
}

/** Combien de mots de l'autre m'attendent, et ai-je déjà pioché aujourd'hui.
 *  shortcut: un mot glissé par l'autre ne déclenche pas de rechargement en direct (la RLS me le cache) ; le compte se met à jour à l'ouverture. */
export function useJarStatus() {
  const q = useLiveQuery(['love_notes'], () =>
    supabase.rpc('love_notes_status').then(({ data, error }) => ({ data: data ? [data as { waiting: number; drawn_today: boolean }] : [], error })),
  )
  return { ...q, status: q.data[0] }
}
