// Lancer : npm test
import assert from 'node:assert/strict'
import { balance, formatEuros, owedFor, parseEuros } from '../src/features/depenses/money.ts'

// Saisie des montants
assert.equal(parseEuros('12'), 1200)
assert.equal(parseEuros('12,5'), 1250)
assert.equal(parseEuros('12.05'), 1205)
assert.equal(parseEuros(' 1 234,56 € '), 123456)
assert.equal(parseEuros('0,1'), 10)
assert.equal(parseEuros('19,99'), 1999) // pas d'erreur de flottant (19.99 * 100 = 1998.999…)
assert.equal(parseEuros('12,345'), null)
assert.equal(parseEuros('-5'), null)
assert.equal(parseEuros('abc'), null)
assert.equal(parseEuros(''), null)
assert.match(formatEuros(1250), /^12,50\s€$/)

// Répartition
assert.equal(owedFor(3000, 'equal'), 1500)
assert.equal(owedFor(1001, 'equal'), 501)
assert.equal(owedFor(3000, 'percent', 40), 1200)
assert.equal(owedFor(3000, 'percent', 100), 3000)
assert.equal(owedFor(3000, 'percent', 120), null)
assert.equal(owedFor(3000, 'amount', 500), 500)
assert.equal(owedFor(3000, 'amount', 3001), null)

// Solde
const A = 'a', B = 'b'
const expenses = [
  { paid_by: A, owed_cents: 1500 }, // A paie 30 € en 50/50 → B doit 15 €
  { paid_by: B, owed_cents: 400 }, //  B paie 8 € en 50/50  → A doit 4 €
]
assert.equal(balance(expenses, [], A), 1100)
assert.equal(balance(expenses, [], B), -1100)
// « On est quittes » : B rembourse 11 € à A
const settled = [{ from_user: B, to_user: A, amount_cents: 1100 }]
assert.equal(balance(expenses, settled, A), 0)
assert.equal(balance(expenses, settled, B), 0)
assert.equal(balance([], [], A), 0)

console.log('dépenses : tous les tests passent')
