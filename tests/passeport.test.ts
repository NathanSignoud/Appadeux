// Lancer : npm test
import assert from 'node:assert/strict'
import { BADGES, badgeProgress, passportStats, suggestions } from '../src/features/passeport/passport.ts'

const film = (countries: string[], year: number | null, language = 'en', runtime: number | null = 110, collectionId: number | null = null) => ({
  countries,
  year,
  language,
  runtime,
  collectionId,
})

const s = passportStats([
  film(['US'], 1999, 'en', 136, 2344), // Matrix
  film(['US'], 2003, 'en', 138, 2344),
  film(['US', 'AU'], 2003, 'en', 129, 2344),
  film(['KR'], 2019, 'ko', 132),
  film(['FR'], 1927, 'fr', 200), // muet, plus de 3 h
  film(['SU'], 1966, 'ru', 205), // pays disparu : compte pour l'Europe
])

assert.equal(s.count, 6)
assert.equal(s.countries.get('US'), 3)
assert.equal(s.countries.size, 5)
assert.deepEqual([...s.continents].sort(), ['Amérique du Nord', 'Asie', 'Europe', 'Océanie'])
assert.deepEqual([...s.decades.keys()].sort(), [1920, 1960, 1990, 2000, 2010])
assert.equal(s.nonEnglish, 3)
assert.equal(s.maxSaga, 3)

const progress = Object.fromEntries(BADGES.map((b) => [b.id, badgeProgress(b, s)]))
assert.equal(progress.trilogie, 3)
assert.equal(progress.decennies, 5) // plafonné à l'objectif
assert.equal(progress.continents, 4)
assert.equal(progress.fleuve, 1)
assert.equal(progress.muet, 1)
assert.equal(progress.habitues, 6)
assert.equal(new Set(BADGES.map((b) => b.id)).size, BADGES.length, 'ids de badges uniques')

// Aucun film : rien de débloqué, pas de NaN / Infinity
const empty = passportStats([])
assert.ok(BADGES.every((b) => badgeProgress(b, empty) === 0))

// Suggestions : la Corée est déjà vue, les années 1990 aussi
const sugg = suggestions(s)
assert.ok(!sugg.some((x) => x.country === 'KR'))
assert.ok(!sugg.some((x) => x.decade === 1990))
assert.equal(sugg[0].country, 'JP')
assert.equal(sugg[1].decade, 1950)

console.log('passeport : tous les tests passent')
