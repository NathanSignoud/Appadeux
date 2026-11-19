// Lancer : npm test
import assert from 'node:assert/strict'
import { agreementRate, nextEpisode, ratingPairs, wrappedStats } from '../src/features/cine/stats.ts'

const A = 'a', B = 'b'
const ratings = [
  { match_id: 'm1', user_id: A, stars: 5 },
  { match_id: 'm1', user_id: B, stars: 5 }, // accord parfait
  { match_id: 'm2', user_id: A, stars: 1 },
  { match_id: 'm2', user_id: B, stars: 5 }, // désaccord total
  { match_id: 'm3', user_id: A, stars: 4 }, // noté par un seul : ignoré
]

// Taux d'accord
const pairs = ratingPairs(ratings, A, B)
assert.equal(pairs.length, 2)
assert.equal(agreementRate(pairs), 50)
assert.equal(agreementRate([{ a: 4, b: 3 }]), 75)
assert.equal(agreementRate([]), null)

// Épisode suivant
const seasons = [{ number: 1, episodes: 8 }, { number: 2, episodes: 10 }]
assert.deepEqual(nextEpisode(seasons, 1, 0), { season: 1, episode: 1 })
assert.deepEqual(nextEpisode(seasons, 1, 7), { season: 1, episode: 8 })
assert.deepEqual(nextEpisode(seasons, 1, 8), { season: 2, episode: 1 })
assert.equal(nextEpisode(seasons, 2, 10), null)
assert.deepEqual(nextEpisode([], 3, 4), { season: 3, episode: 5 }) // saisons inconnues : on avance quand même

// Wrapped
const movie = (title: string, runtime: number, genres: number[]) => ({ title, runtime, genres })
const matches = [
  { id: 'm1', done_at: '2026-03-01T20:00:00Z', movie: movie('Parfait', 120, [18, 35]) },
  { id: 'm2', done_at: '2026-06-01T20:00:00Z', movie: movie('Clivant', 150, [27, 18]) },
  { id: 'm3', done_at: '2025-12-31T20:00:00Z', movie: movie('L’an dernier', 100, [35]) },
  { id: 'm4', done_at: null, movie: movie('Pas vu', 90, [35]) },
]
const w = wrappedStats(2026, matches, ratings, ['2026-02-02T10:00:00Z', '2025-05-05T10:00:00Z'], A, B)
assert.equal(w.count, 2)
assert.equal(w.minutes, 270)
assert.equal(w.favoriteGenre, 18)
assert.equal(w.biggestDisagreement?.movie.title, 'Clivant')
assert.equal(w.bestRated?.movie.title, 'Parfait')
assert.equal(w.agreement, 50)
assert.equal(w.betrayals, 1)

const vide = wrappedStats(2030, matches, ratings, [], A, B)
assert.equal(vide.count, 0)
assert.equal(vide.biggestDisagreement, null)
assert.equal(vide.agreement, null)

console.log('ciné : tous les tests passent')
