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
  'New password should be different from the old password.': 'Le nouveau mot de passe doit être différent de l’ancien.',
  veto_used: 'Tu as déjà utilisé ton veto cette semaine. Il revient lundi.',
  match_not_found: 'Ce film n’est plus dans la watchlist.',
  already_drawn_today: 'Tu as déjà pioché un mot aujourd’hui. Le bocal t’attend demain.',
  jar_empty: 'Le bocal est vide pour l’instant.',
  bet_transition: 'Ce pari a déjà avancé : recharge la page.',
  bet_not_yours: 'C’est à l’autre de répondre à ton pari.',
}

export function frenchError(error: { message: string }): string {
  return messages[error.message] ?? error.message
}
