// Le jardin de nous : une plante calculée à partir de ce que vous vivez ensemble (aucune table). Testé : tests/jardin.test.ts.

/** Ce qui fait pousser la plante, et combien ça rapporte. Pour ajouter une source : une ligne ici + son compte dans useGarden. */
export const SOURCES = [
  { id: 'films', label: 'Film vu ensemble', points: 1 },
  { id: 'lettres', label: 'Lettre de l’alphabet faite', points: 3 },
  { id: 'series', label: 'Série terminée', points: 2 },
  { id: 'gages', label: 'Gage honoré', points: 1 },
  { id: 'mots', label: 'Mot doux pioché', points: 1 },
  { id: 'bons', label: 'Bon utilisé', points: 1 },
] as const
export type SourceId = (typeof SOURCES)[number]['id']

const STAGES = [
  { min: 0, label: 'Une graine' },
  { min: 1, label: 'Une pousse' },
  { min: 5, label: 'Une jeune plante' },
  { min: 15, label: 'Une belle plante' },
  { min: 35, label: 'En fleurs' },
]

const DAY_MS = 86_400_000

export function garden(counts: Record<SourceId, number>, lastActivity: Date | null, now = new Date()) {
  const points = SOURCES.reduce((sum, s) => sum + counts[s.id] * s.points, 0)
  const stage = STAGES.filter((s) => points >= s.min).length - 1 // 0 à 4
  // Soif : rien de partagé depuis une semaine → elle penche ; trois semaines → elle fane. Une graine n'a pas soif.
  const idleDays = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / DAY_MS) : 0
  const thirst = stage === 0 ? 0 : idleDays >= 21 ? 2 : idleDays >= 7 ? 1 : 0
  const nextStage = STAGES[stage + 1]
  return {
    points,
    stage,
    label: STAGES[stage].label,
    leaves: Math.min(8, Math.floor(points / 2)),
    flowers: stage < 4 ? 0 : Math.min(7, 1 + Math.floor((points - 35) / 10)),
    height: Math.min(1, points / 40), // 0 → 1 : hauteur de la tige
    thirst: thirst as 0 | 1 | 2,
    toNext: nextStage ? nextStage.min - points : null,
  }
}

export const thirstText = ['', 'Elle a un peu soif : ça fait une semaine sans rien partager.', 'Elle fane… Un film, un mot doux, et elle se redresse.']
export const thirstShort = ['', 'Elle a un peu soif', 'Elle fane, vite un moment à deux']
