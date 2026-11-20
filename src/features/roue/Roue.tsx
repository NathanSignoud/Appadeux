import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui'
import { randomIndex, spinTarget } from './wheel'

const KEY = 'nous.roue'
const MAX = 12
// Les 3 premières s'assombrissent en mode sombre, les 3 dernières restent vives (texte foncé dessus, voir plus bas)
const COLORS = ['fill-peche', 'fill-menthe', 'fill-beurre', 'fill-violet', 'fill-encre-a', 'fill-encre-b']
const SPIN_MS = 4200

// Les derniers choix restent sur ce téléphone, pour ne pas les retaper
function loadOptions(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (Array.isArray(saved) && saved.every((s) => typeof s === 'string')) return saved.slice(0, MAX)
  } catch {
    // navigation privée ou valeur abîmée : on repart des exemples
  }
  return ['Pizza', 'Sushis', 'Burger']
}
function saveOptions(options: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(options))
  } catch {
    // pas grave : les choix ne survivront pas au rechargement
  }
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const short = (s: string) => (s.length > 14 ? `${s.slice(0, 13)}…` : s)

/** Part de roue i sur n, en chemin SVG (centre 100,100, rayon 96), en partant du haut dans le sens horaire. */
function slice(i: number, n: number) {
  const a0 = ((i / n) * 360 - 90) * (Math.PI / 180)
  const a1 = (((i + 1) / n) * 360 - 90) * (Math.PI / 180)
  const p = (a: number) => `${100 + 96 * Math.cos(a)} ${100 + 96 * Math.sin(a)}`
  return `M100 100 L ${p(a0)} A 96 96 0 ${1 / n > 0.5 ? 1 : 0} 1 ${p(a1)} Z`
}

export function Roue() {
  const [options, setOptions] = useState(loadOptions)
  const [draft, setDraft] = useState('')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const update = (next: string[]) => {
    setOptions(next)
    saveOptions(next)
    setResult(null)
  }

  function add(e: FormEvent) {
    e.preventDefault()
    const value = draft.trim()
    if (!value || options.length >= MAX) return
    update([...options, value])
    setDraft('')
  }

  function spin() {
    const winner = randomIndex(options.length) // le résultat est tiré avant l'animation
    setResult(null)
    const target = spinTarget(rotation, options.length, winner)
    setRotation(target)
    if (reducedMotion()) return setResult(options[winner])
    setSpinning(true)
    setTimeout(() => {
      setSpinning(false)
      setResult(options[winner])
    }, SPIN_MS)
  }

  const n = options.length

  return (
    <>
      <h1 className="text-3xl font-bold">La roue</h1>

      <section className="flex flex-col items-center gap-4 rounded-[32px] bg-white px-4 py-6">
        <div className="relative w-full max-w-72">
          {/* Le pointeur, fixe, en haut */}
          <svg viewBox="0 0 24 20" aria-hidden="true" className="absolute -top-2 left-1/2 z-10 w-7 -translate-x-1/2">
            <path d="M12 20 L2 2 Q12 -2 22 2 Z" className="fill-prune" />
          </svg>
          <svg
            viewBox="0 0 200 200"
            role="img"
            aria-label={`Roue avec ${n} choix`}
            className="w-full"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.7, 0.1, 1)` : 'none' }}
          >
            {n === 1 ? (
              <circle cx="100" cy="100" r="96" className={COLORS[0]} />
            ) : (
              options.map((_, i) => <path key={i} d={slice(i, n)} className={`${COLORS[i % COLORS.length]} stroke-white`} strokeWidth="2" />)
            )}
            {options.map((o, i) => {
              const angle = ((i + 0.5) / n) * 360 // texte au milieu de sa part
              // moitié gauche : on retourne le texte pour qu'il ne soit jamais à l'envers
              const transform = angle > 180 ? `rotate(${angle + 90} 100 100) translate(-56 0)` : `rotate(${angle - 90} 100 100) translate(56 0)`
              return (
                <text
                  key={i}
                  x="100"
                  y="100"
                  transform={transform}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`fill-prune text-[11px] font-semibold ${i % COLORS.length >= 3 ? 'dark:fill-lilas' : ''}`}
                >
                  {short(o)}
                </text>
              )
            })}
            <circle cx="100" cy="100" r="13" className="fill-white" />
          </svg>
        </div>

        <div aria-live="polite" className="min-h-16 text-center">
          {result && (
            <p className="motion-safe:animate-[pop_420ms_ease-out]">
              <span className="block text-prune-doux">La roue a dit</span>
              <span className="text-3xl font-bold">{result}</span>
            </p>
          )}
        </div>

        <Button onClick={spin} disabled={spinning || n < 2} className="w-full max-w-72">
          {result ? 'Relancer' : 'Tourner'}
        </Button>
        {n < 2 && <p className="text-prune-doux">Ajoute au moins deux choix.</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xl font-bold">
          Les choix <span className="font-medium text-prune-doux">{n}/{MAX}</span>
        </h2>
        <form onSubmit={add} className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={40}
            disabled={spinning || n >= MAX}
            placeholder={n >= MAX ? '12 choix maximum' : 'Ajouter un choix…'}
            aria-label="Nouveau choix"
            enterKeyHint="done"
            className="min-h-12 min-w-0 flex-1 rounded-full bg-white px-5 text-lg outline-none focus-visible:ring-3 focus-visible:ring-violet disabled:opacity-60"
          />
          <button type="submit" aria-label="Ajouter" disabled={spinning || n >= MAX} className="grid size-12 shrink-0 place-items-center rounded-full bg-prune text-white active:scale-95 disabled:opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </form>
        <ul className="flex flex-wrap gap-2">
          {options.map((o, i) => (
            <li key={`${o}-${i}`} className="flex min-h-11 items-center gap-1 rounded-full bg-white py-1 pr-1 pl-4 font-medium">
              {o}
              <button
                type="button"
                onClick={() => update(options.filter((_, j) => j !== i))}
                disabled={spinning}
                aria-label={`Retirer ${o}`}
                className="grid size-9 place-items-center rounded-full text-prune-doux active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        {n > 0 && (
          <button type="button" onClick={() => update([])} disabled={spinning} className="min-h-11 self-start rounded-full px-3 font-semibold text-prune-doux underline underline-offset-4">
            Tout effacer
          </button>
        )}
      </section>
    </>
  )
}
