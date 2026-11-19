// Génère src/features/passeport/worldMap.ts depuis @svg-maps/world (CC BY 4.0), en version allégée.
// Lancer : node scripts/simplify-map.mjs   (une seule fois ; le résultat est versionné)
// Les tracés source n'utilisent que « m » relatif (lignes implicites) et « z ».
import { writeFileSync } from 'node:fs'
import world from '@svg-maps/world'

const TOLERANCE = 1.4 // unités du viewBox (1010 de large) : en dessous, un point n'apporte rien à l'écran
const r1 = (n) => Math.round(n * 10) / 10
const num = (n) => String(r1(n)).replace(/^(-?)0\./, '$1.')

function simplify(path) {
  const rings = []
  let start = [0, 0]
  let cur = [0, 0]
  for (const sub of path.split(/z/i)) {
    const nums = sub.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number)
    if (!nums || nums.length < 2) continue
    const pts = []
    for (let i = 0; i + 1 < nums.length; i += 2) {
      cur = [cur[0] + nums[i], cur[1] + nums[i + 1]]
      pts.push(cur)
    }
    start = pts[0]
    cur = start // après « z », le point courant revient au début du sous-tracé
    const kept = [pts[0]]
    for (const p of pts.slice(1)) {
      const last = kept[kept.length - 1]
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= TOLERANCE) kept.push(p)
    }
    const xs = kept.map((p) => p[0])
    const ys = kept.map((p) => p[1])
    const size = Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys)
    rings.push({ kept, size })
  }
  // On garde les formes visibles, et toujours la plus grande (les micro-États restent sur la carte)
  rings.sort((a, b) => b.size - a.size)
  // Pays minuscule (Singapour, Hong Kong, Monaco…) : on renvoie aussi un centre pour y dessiner un repère
  const big = rings[0]
  const center = big.size < 8 ? [r1(big.kept.reduce((s, p) => s + p[0], 0) / big.kept.length), r1(big.kept.reduce((s, p) => s + p[1], 0) / big.kept.length)] : null
  const visible = rings.filter((r, i) => i === 0 || (r.size >= 3 && r.kept.length >= 3))
  const d = visible
    .filter(({ kept }) => kept.length >= 3)
    .map(({ kept }) => {
      const abs = kept.map(([x, y]) => [r1(x), r1(y)])
      let d = `M${num(abs[0][0])} ${num(abs[0][1])}l`
      for (let i = 1; i < abs.length; i++) {
        const dx = abs[i][0] - abs[i - 1][0]
        const dy = abs[i][1] - abs[i - 1][1]
        d += `${num(dx)}${dy < 0 ? '' : ' '}${num(dy)} `
      }
      return d.trimEnd() + 'z'
    })
    .join('')
    .replace(/ -/g, '-')
  return { d, center }
}

const rows = world.locations
  .filter((l) => !l.id.startsWith('um-'))
  .map((l) => {
    const { d, center } = simplify(l.path)
    return `  ['${l.id.toUpperCase()}', '${d}'${center ? `, [${center}]` : ''}],`
  })
const out = `// GÉNÉRÉ par scripts/simplify-map.mjs — ne pas éditer à la main.
// Carte : @svg-maps/world par VictorCazanave, licence CC BY 4.0 (https://github.com/VictorCazanave/svg-maps), tracés simplifiés.
export const WORLD_VIEWBOX = '${world.viewBox}'
export const WORLD: [code: string, path: string, center?: [number, number]][] = [
${rows.join('\n')}
]
`
writeFileSync('src/features/passeport/worldMap.ts', out)
console.log(`worldMap.ts : ${rows.length} pays, ${(out.length / 1024).toFixed(0)} Ko`)
