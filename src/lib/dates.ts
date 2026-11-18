// Dates en heure locale (vous êtes tous les deux en France). Aucune dépendance : testé par tests/dates.test.ts.

const DAY_MS = 86_400_000
const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', o)
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** « 2026-11-24 » en heure locale : comparable comme une chaîne. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const timeKey = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** Jours calendaires d'ici la date (J-n). Math.round absorbe les journées de 23 h / 25 h des changements d'heure. */
export const daysUntil = (target: Date, now = new Date()) => Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / DAY_MS)

export type Span = { starts_at: string; ends_at: string; all_day: boolean }

/** Premier et dernier jour couverts, inclus. Journée entière : ends_at = minuit du dernier jour. */
export function spanDays(e: Span): [string, string] {
  const start = new Date(e.starts_at)
  let end = new Date(e.ends_at)
  // un événement à heure qui finit pile à minuit ne déborde pas sur le lendemain
  if (!e.all_day && end > start && end.getHours() === 0 && end.getMinutes() === 0) end = new Date(end.getTime() - 1)
  return [dayKey(start), dayKey(end)]
}

export function coversDay(e: Span, day: Date) {
  const k = dayKey(day)
  const [first, last] = spanDays(e)
  return first <= k && k <= last
}

/** Fin réelle (pour savoir si c'est passé) : lendemain minuit pour une journée entière. */
export const endOf = (e: Span) => (e.all_day ? addDays(new Date(e.ends_at), 1) : new Date(e.ends_at))

export const formatDayLong = (d: Date) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(d)
export const formatDayShort = (d: Date) => fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(d)
export const formatMonth = (d: Date) => capitalize(fmt({ month: 'long', year: 'numeric' }).format(d))
export const formatTime = (d: Date) => `${d.getHours()}h${pad(d.getMinutes())}`

/** « Aujourd'hui », « Demain », sinon « Vendredi 21 novembre ». */
export function dayLabel(d: Date, now = new Date()) {
  const n = daysUntil(d, now)
  if (n === 0) return 'Aujourd’hui'
  if (n === 1) return 'Demain'
  return capitalize(formatDayLong(d))
}

/** « Demain à 20h30 », « Du lun. 24 nov. au jeu. 27 nov. »… */
export function formatWhen(e: Span, now = new Date()) {
  const start = new Date(e.starts_at)
  const [first, last] = spanDays(e)
  if (e.all_day) return first === last ? `${dayLabel(start, now)}, toute la journée` : `Du ${formatDayShort(start)} au ${formatDayShort(new Date(e.ends_at))}`
  const end = new Date(e.ends_at)
  return first === last ? `${dayLabel(start, now)}, ${formatTime(start)} – ${formatTime(end)}` : `${dayLabel(start, now)} à ${formatTime(start)} → ${formatDayShort(end)}`
}

/** « jusqu'à jeudi » dans la semaine, sinon « jusqu'au 1er décembre ». lastDay = dernier jour d'absence. */
export function untilPhrase(lastDay: Date, now = new Date()) {
  const n = daysUntil(lastDay, now)
  if (n <= 0) return 'jusqu’à ce soir'
  if (n === 1) return 'jusqu’à demain'
  if (n < 7) return `jusqu’à ${fmt({ weekday: 'long' }).format(lastDay)}`
  return `jusqu’au ${fmt({ day: 'numeric', month: 'long' }).format(lastDay).replace(/^1 /, '1er ')}`
}

/** Jours affichés dans la grille du mois : semaines complètes, du lundi au dimanche. */
export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7 // lundi = 0
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const count = Math.ceil((offset + daysInMonth) / 7) * 7
  return Array.from({ length: count }, (_, i) => addDays(first, i - offset))
}
