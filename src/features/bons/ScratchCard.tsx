import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

const BRUSH = 26 // rayon du « doigt », en pixels CSS
const REVEAL_AT = 0.45 // part grattée qui révèle tout

/** Surface à gratter au doigt posée sur `children`. Au-delà de 45 % gratté (ou bouton « Tout révéler »), onReveal. */
export function ScratchCard({ children, onReveal }: { children: ReactNode; onReveal: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const c = canvas.current!
    const dpr = window.devicePixelRatio || 1
    c.width = c.offsetWidth * dpr
    c.height = c.offsetHeight * dpr
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    const css = getComputedStyle(document.documentElement)
    // Couche argentée façon guimauve : violet, pois clairs, consigne au centre
    ctx.fillStyle = css.getPropertyValue('--color-violet').trim() || '#a994e8'
    ctx.fillRect(0, 0, c.offsetWidth, c.offsetHeight)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    for (let x = 10; x < c.offsetWidth; x += 22) for (let y = 10; y < c.offsetHeight; y += 22) ctx.fillRect(x + ((y / 22) % 2) * 11, y, 4, 4)
    ctx.fillStyle = '#fff'
    ctx.font = `600 22px ${css.getPropertyValue('--font-sans')}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Gratte-moi', c.offsetWidth / 2, c.offsetHeight / 2)
  }, [])

  function reveal() {
    if (revealed) return
    setRevealed(true)
    onReveal()
  }

  function scratch(e: PointerEvent<HTMLCanvasElement>) {
    const c = canvas.current!
    const r = c.getBoundingClientRect()
    const p = { x: e.clientX - r.left, y: e.clientY - r.top }
    const ctx = c.getContext('2d')!
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = BRUSH * 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current?.x ?? p.x, last.current?.y ?? p.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  /** Part de la surface déjà grattée (échantillonnage d'un pixel sur 8 dans chaque sens). */
  function scratchedRatio() {
    const c = canvas.current!
    const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
    let clear = 0
    let total = 0
    for (let y = 0; y < c.height; y += 8) {
      for (let x = 0; x < c.width; x += 8) {
        total++
        if (data[(y * c.width + x) * 4 + 3] === 0) clear++
      }
    }
    return clear / total
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {children}
        <canvas
          ref={canvas}
          aria-hidden="true"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            last.current = null
            scratch(e)
          }}
          onPointerMove={(e) => e.buttons && scratch(e)}
          onPointerUp={() => scratchedRatio() > REVEAL_AT && reveal()}
          className={`absolute inset-0 size-full cursor-grab touch-none rounded-[22px] transition-opacity duration-500 ${revealed ? 'pointer-events-none opacity-0' : ''}`}
        />
      </div>
      {!revealed && (
        <button type="button" onClick={reveal} className="min-h-11 self-center rounded-full px-4 font-semibold text-prune-doux underline underline-offset-4">
          Tout révéler d’un coup
        </button>
      )}
    </div>
  )
}
