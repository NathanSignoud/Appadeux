import type { Tables } from '../../lib/database.types'
import type { Member } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { useLiveQuery } from '../../lib/useLiveQuery'

export type LetterRow = Tables<'alphabet_letters'> & { alphabet_photos: Tables<'alphabet_photos'>[] }
export type LetterStatus = 'todo' | 'planned' | 'done'

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
export const STATUS_LABELS: Record<LetterStatus, string> = { todo: 'À faire', planned: 'Planifiée', done: 'Faite' }
export const BUCKET = 'alphabet'

/** Les lettres déjà commencées (une lettre jamais touchée n'a pas de ligne), photos dans l'ordre d'ajout. */
export function useLetters() {
  return useLiveQuery(['alphabet_letters', 'alphabet_photos'], () =>
    supabase.from('alphabet_letters').select('*, alphabet_photos(*)').order('created_at', { referencedTable: 'alphabet_photos' }),
  )
}

/** Alternance par défaut : A pour le créateur du couple, B pour l'autre, etc. ; modifiable lettre par lettre. */
export function organizerOf(letter: string, row: LetterRow | undefined, members: Member[]) {
  const fallback = members[LETTERS.indexOf(letter) % 2]
  return members.find((m) => m.user_id === row?.organizer_id) ?? fallback
}

export const statusOf = (row: LetterRow | undefined): LetterStatus => (row?.status as LetterStatus) ?? 'todo'

/** Photo de couverture = la première ajoutée. */
export const coverOf = (row: LetterRow | undefined) => row?.alphabet_photos[0]?.path
