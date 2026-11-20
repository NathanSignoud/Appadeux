// Calcul de la roue, pur et testé (tests/roue.test.ts). Angles en degrés, sens horaire, 0 = le pointeur en haut.

/** Rotation finale pour que la part `winner` s'arrête pile sous le pointeur, après `turns` tours complets. */
export function spinTarget(current: number, count: number, winner: number, turns = 5) {
  const seg = 360 / count
  const desired = (((-(winner + 0.5) * seg) % 360) + 360) % 360 // la roue tourne, le pointeur reste fixe
  const currentMod = ((current % 360) + 360) % 360
  const delta = (desired - currentMod + 360) % 360
  return current + turns * 360 + (delta > 359.999 ? 0 : delta) // 359,9999… = arrondi flottant, pas un tour de plus
}

/** Part sous le pointeur pour une rotation donnée. */
export function segmentAt(rotation: number, count: number) {
  const angle = (((-rotation) % 360) + 360) % 360
  return Math.floor(angle / (360 / count)) % count
}

/** Tirage vraiment aléatoire (crypto), décidé AVANT l'animation. */
export function randomIndex(count: number) {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % count
}
