import type { garden } from './garden'

type State = ReturnType<typeof garden>

/** La plante dessinée : pot guimauve, tige qui penche quand elle a soif, fleurs riso (les deux encres) quand elle fleurit. */
export function Plant({ state, className = '' }: { state: State; className?: string }) {
  const baseY = 190
  const topY = baseY - (48 + state.height * 112)
  const bend = [0, 22, 46][state.thirst] // elle penche quand elle a soif
  const at = (t: number) => ({ x: 100 + bend * t * t, y: baseY + (topY - baseY) * t }) // point sur la tige (0 = pot, 1 = sommet)
  const top = at(1)
  const leafCount = state.stage === 0 ? 0 : Math.max(2, state.leaves)
  const leafClass = state.thirst === 2 ? 'fill-lilas-fonce' : 'fill-menthe'

  return (
    <svg viewBox="0 0 200 240" role="img" aria-label={`${state.label}${state.thirst ? ', elle a soif' : ''}`} className={className}>
      {/* Le pot, jamais parfaitement régulier, avec sa terre */}
      <path d="M52 190 C 50 186 150 184 148 190 L 140 228 C 139 234 61 235 60 228 Z" className="fill-peche" />
      <path d="M48 186 C 47 180 153 178 152 186 C 153 194 47 196 48 186 Z" className="fill-peche brightness-95" />
      <ellipse cx={100} cy={186} rx={44} ry={4} className="fill-prune-doux/35" />
      {state.stage === 0 && <ellipse cx={100} cy={180} rx={8} ry={5.5} transform="rotate(-20 100 180)" className="fill-prune-doux" />}
      {state.stage > 0 && (
        <>
          <path d={`M100 ${baseY} Q ${100 + bend / 2} ${(baseY + topY) / 2} ${top.x} ${top.y}`} fill="none" strokeWidth={5} strokeLinecap="round" className="stroke-prune-doux/50" />
          {Array.from({ length: leafCount }, (_, i) => {
            const t = (i + 1) / (leafCount + 1)
            const p = at(t)
            const side = i % 2 ? 1 : -1
            const angle = side * (-30 + state.thirst * 40) // vers le haut en forme, elles retombent avec la soif
            return (
              <ellipse key={i} cx={p.x + side * 14} cy={p.y} rx={15} ry={7} transform={`rotate(${angle} ${p.x} ${p.y})`} strokeWidth={1.2} className={`${leafClass} stroke-prune/20`} />
            )
          })}
          {/* Bouton avant la floraison, puis fleurs aux deux encres */}
          {state.stage === 3 && <circle cx={top.x} cy={top.y} r={6} className="fill-violet" />}
          {Array.from({ length: state.flowers }, (_, i) => {
            const angle = (i / Math.max(1, state.flowers)) * Math.PI * 2 - Math.PI / 2
            const r = i === 0 ? 0 : 22
            const cx = top.x + Math.cos(angle) * r
            const cy = top.y + Math.sin(angle) * r * 0.8
            return (
              <g key={i} className={state.thirst === 2 ? 'opacity-50' : ''}>
                <circle cx={cx - 3} cy={cy - 2} r={10} className="fill-encre-a mix-blend-multiply dark:mix-blend-screen" />
                <circle cx={cx + 3} cy={cy + 2} r={10} className="fill-encre-b mix-blend-multiply dark:mix-blend-screen" />
                <circle cx={cx} cy={cy} r={3.5} className="fill-beurre" />
              </g>
            )
          })}
        </>
      )}
    </svg>
  )
}
