// Lancer : npm test
import assert from 'node:assert/strict'
import { garden } from '../src/features/jardin/garden.ts'

const zero = { films: 0, lettres: 0, series: 0, gages: 0, mots: 0, bons: 0 }
const now = new Date('2026-11-20T12:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)

// Graine : rien encore, et pas de soif même sans activité
const seed = garden(zero, null, now)
assert.equal(seed.stage, 0)
assert.equal(seed.label, 'Une graine')
assert.equal(seed.thirst, 0)
assert.equal(seed.toNext, 1)

// Points pondérés : 4 films + 2 lettres (×3) + 1 série (×2) = 12 → jeune plante
const young = garden({ ...zero, films: 4, lettres: 2, series: 1 }, daysAgo(2), now)
assert.equal(young.points, 12)
assert.equal(young.label, 'Une jeune plante')
assert.equal(young.leaves, 6)
assert.equal(young.flowers, 0)
assert.equal(young.toNext, 3)

// En fleurs : 35 points = 1 fleur, 55 = 3, plafonné à 7 ; plus d'étape suivante
assert.equal(garden({ ...zero, films: 35 }, now, now).flowers, 1)
assert.equal(garden({ ...zero, films: 55 }, now, now).flowers, 3)
assert.equal(garden({ ...zero, films: 500 }, now, now).flowers, 7)
assert.equal(garden({ ...zero, films: 500 }, now, now).toNext, null)
assert.equal(garden({ ...zero, films: 500 }, now, now).height, 1)

// Soif : 7 jours → penche, 21 jours → fane
assert.equal(garden({ ...zero, films: 3 }, daysAgo(6), now).thirst, 0)
assert.equal(garden({ ...zero, films: 3 }, daysAgo(7), now).thirst, 1)
assert.equal(garden({ ...zero, films: 3 }, daysAgo(21), now).thirst, 2)

console.log('jardin : tous les tests passent')
