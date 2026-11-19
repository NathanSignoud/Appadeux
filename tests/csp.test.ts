// Lancer : npm test
// Le script de thème inline de index.html n'est autorisé par la CSP (public/_headers) que via son empreinte exacte.
// Si on le modifie sans mettre l'empreinte à jour, le navigateur le bloque : ce test le signale avant le déploiement.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const html = readFileSync('index.html', 'utf8')
const headers = readFileSync('public/_headers', 'utf8')
// Le navigateur normalise les fins de ligne (CRLF → LF) avant de calculer l'empreinte : on fait pareil (checkout Windows)
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1].replace(/\r\n?/g, '\n'))

assert.equal(inline.length, 1, 'un seul script inline attendu dans index.html')
const hash = `'sha256-${createHash('sha256').update(inline[0]).digest('base64')}'`
assert.ok(headers.includes(hash), `Mettre à jour script-src dans public/_headers avec ${hash}`)
assert.match(headers, /frame-ancestors 'none'/)

console.log('csp : en-têtes à jour')
