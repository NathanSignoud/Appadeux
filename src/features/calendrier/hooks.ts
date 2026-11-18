import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useLiveQuery } from '../../lib/useLiveQuery'

export type CalEvent = Tables<'events'>
export type EventKind = 'together' | 'solo' | 'absence'

export const KIND_LABELS: Record<EventKind, string> = { together: 'À deux', solo: 'Solo', absence: 'Absence' }

/** Tous les événements du couple, à jour en direct. shortcut: tout est chargé ; filtrer par période si la table dépasse quelques milliers de lignes. */
export function useEvents() {
  return useLiveQuery(['events'], () => supabase.from('events').select('*').order('starts_at'))
}
