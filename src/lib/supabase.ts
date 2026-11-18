import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquant : copie .env.example en .env.local et remplis-le.')
}

export const supabase = createClient<Database>(url, key)

// Les fonctions SQL lèvent des codes courts ; on les traduit pour l'interface.
const messages: Record<string, string> = {
  invalid_code: 'Ce code ne correspond à aucun couple. Vérifie les 8 caractères.',
  couple_full: 'Ce couple est déjà complet.',
  already_in_couple: 'Ton compte fait déjà partie d’un couple.',
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'User already registered': 'Un compte existe déjà avec cet email. Connecte-toi.',
  'Signups not allowed for this instance': 'Les inscriptions sont fermées.',
}

export function frenchError(error: { message: string }): string {
  return messages[error.message] ?? error.message
}
