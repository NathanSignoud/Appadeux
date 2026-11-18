// Lancer : npm test   (Node exécute le TypeScript directement, sans dépendance)
process.env.TZ = 'Europe/Paris'
import assert from 'node:assert/strict'
import { coversDay, daysUntil, formatWhen, monthGrid, spanDays, untilPhrase } from '../src/lib/dates.ts'

const local = (s: string) => new Date(s).toISOString() // « 2026-11-24T00:00 » = heure de Paris

// Absence de 3 jours en journée entière : du lundi 23 au mercredi 25 novembre inclus
const absence = { starts_at: local('2026-11-23T00:00'), ends_at: local('2026-11-25T00:00'), all_day: true }
assert.deepEqual(spanDays(absence), ['2026-11-23', '2026-11-25'])
assert.equal(coversDay(absence, new Date('2026-11-25T23:00')), true)
assert.equal(coversDay(absence, new Date('2026-11-26T00:30')), false)

// Soirée qui finit pile à minuit : ne déborde pas sur le lendemain
const soiree = { starts_at: local('2026-11-21T20:00'), ends_at: local('2026-11-22T00:00'), all_day: false }
assert.deepEqual(spanDays(soiree), ['2026-11-21', '2026-11-21'])

// J-n à travers le passage à l'heure d'hiver (25 octobre 2026)
assert.equal(daysUntil(new Date('2026-10-27T10:00'), new Date('2026-10-24T22:00')), 3)
assert.equal(daysUntil(new Date('2026-11-30T07:12'), new Date('2026-11-18T23:59')), 12)

// Phrases
const mardi = new Date('2026-11-24T09:00')
assert.equal(untilPhrase(new Date('2026-11-26T00:00'), mardi), 'jusqu’à jeudi')
assert.equal(untilPhrase(new Date('2026-11-25T00:00'), mardi), 'jusqu’à demain')
assert.equal(untilPhrase(new Date('2026-12-01T00:00'), mardi), 'jusqu’au 1er décembre')
assert.equal(formatWhen(soiree, new Date('2026-11-20T12:00')), 'Demain, 20h00 – 0h00')
assert.equal(formatWhen(absence, mardi), 'Du lun. 23 nov. au mer. 25 nov.')

// Grille : novembre 2026 commence un dimanche → la grille démarre le lundi 26 octobre, 6 semaines
const grid = monthGrid(new Date('2026-11-15T12:00'))
assert.equal(grid.length, 42)
assert.equal(grid[0].getDate(), 26)
assert.equal(grid[0].getDay(), 1)

console.log('dates : tous les tests passent')
