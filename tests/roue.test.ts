// Lancer : npm test
import assert from 'node:assert/strict'
import { randomIndex, segmentAt, spinTarget } from '../src/features/roue/wheel.ts'

// Quelle que soit la position de départ, la roue s'arrête sur le gagnant tiré, après au moins 5 tours
for (const count of [2, 3, 5, 7, 12]) {
  let rotation = 0
  for (let i = 0; i < 50; i++) {
    const winner = randomIndex(count)
    const target = spinTarget(rotation, count, winner)
    assert.equal(segmentAt(target, count), winner, `${count} parts, gagnant ${winner}`)
    assert.ok(target - rotation > 5 * 360 - 1e-6 && target - rotation < 6 * 360) // tolérance : arrondis flottants
    rotation = target // on enchaîne les tirages depuis la position précédente
  }
}
assert.equal(segmentAt(0, 4), 0) // roue au repos : la première part démarre sous le pointeur
assert.equal(segmentAt(1, 4), 3) // un degré de rotation horaire : c’est la dernière part qui arrive sous le pointeur

// Le tirage couvre toutes les parts
const seen = new Set(Array.from({ length: 500 }, () => randomIndex(6)))
assert.equal(seen.size, 6)

console.log('roue : tous les tests passent')
