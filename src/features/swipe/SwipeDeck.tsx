import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Button, Message } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { MatchOverlay } from './MatchOverlay'
import type { SwipeSource } from './types'

const THRESHOLD = 110 // px de glissement pour valider
const EXIT_MS = 220

// État d'un paquet : un nouvel objet à chaque changement de filtres, pour ignorer les réponses de l'ancien
type Deck = { page: number; hasMore: boolean; busy: boolean; seen: Set<string>; ready: Promise<void> }

export function SwipeDeck<T>({ source, empty }: { source: SwipeSource<T>; empty: ReactNode }) {
  const [queue, setQueue] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exit, setExit] = useState<0 | 1 | -1>(0)
  const [match, setMatch] = useState<T | null>(null)
  const sourceRef = useRef(source)
  sourceRef.current = source
  const deck = useRef<Deck | null>(null)

  const refill = useCallback(async () => {
    const d = deck.current
    if (!d || d.busy || !d.hasMore) return
    d.busy = true
    setLoading(true)
    try {
      await d.ready
      const src = sourceRef.current
      const fresh: T[] = []
      // On saute les pages déjà vues, sans boucler indéfiniment
      for (let i = 0; i < 5 && fresh.length < 5 && d.hasMore; i++) {
        const { items, hasMore } = await src.fetchPage(d.page++)
        d.hasMore = hasMore
        for (const item of items) {
          const id = src.getId(item)
          if (!d.seen.has(id)) {
            d.seen.add(id)
            fresh.push(item)
          }
        }
      }
      if (deck.current !== d) return
      setError(null)
      setQueue((q) => [...q, ...fresh])
    } catch (e) {
      if (deck.current === d) setError(e instanceof Error ? e.message : 'Erreur de chargement.')
    } finally {
      d.busy = false
      if (deck.current === d) setLoading(false)
    }
  }, [])

  // Nouveau paquet à chaque changement de source : on exclut ce que j'ai déjà swipé et ce qui est déjà dans les matchs
  useEffect(() => {
    const seen = new Set<string>()
    const kind = source.kind
    const ready = Promise.all([
      // shortcut: PostgREST plafonne à 1000 lignes ; au-delà, de vieux swipes peuvent revenir (re-swiper ne casse rien)
      supabase.from('swipes').select('item_id').eq('kind', kind),
      supabase.from('matches').select('item_id').eq('kind', kind),
    ]).then(([s, m]) => {
      for (const row of [...(s.data ?? []), ...(m.data ?? [])]) seen.add(row.item_id)
    })
    deck.current = { page: 1, hasMore: true, busy: false, seen, ready }
    setQueue([])
    setExit(0)
    void refill()
  }, [source.key, source.kind, refill])

  // Match ! Le trigger SQL crée la ligne ; le Realtime prévient les deux en même temps
  useEffect(() => {
    const channel = supabase
      .channel(`matches-${source.kind}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `kind=eq.${source.kind}` }, ({ new: row }) => {
        if (row.source === 'match') setMatch(sourceRef.current.fromPayload(row.payload))
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [source.kind])

  const top = queue[0]

  async function record(item: T, liked: boolean) {
    const src = sourceRef.current
    const { error } = await supabase
      .from('swipes')
      .upsert({ kind: src.kind, item_id: src.getId(item), liked, payload: src.toPayload(item) })
    if (error) {
      setQueue((q) => [item, ...q])
      setError('Ton choix n’a pas été enregistré. Vérifie ta connexion et réessaie.')
    }
  }

  function decide(dir: 1 | -1) {
    if (!top || exit) return
    setExit(dir)
    setTimeout(() => {
      setExit(0)
      setQueue((q) => q.slice(1))
      if (queue.length <= 4) void refill()
      void record(top, dir === 1)
    }, EXIT_MS)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[min(64dvh,560px)]">
        {queue[1] && (
          <div inert className="absolute inset-0 scale-[0.94] opacity-70">
            {source.renderCard(queue[1])}
          </div>
        )}
        {top ? (
          <DraggableCard key={source.getId(top)} exit={exit} onRelease={decide}>
            {source.renderCard(top)}
          </DraggableCard>
        ) : (
          <div className="blob grid h-full place-items-center bg-white px-10 text-center">
            {loading ? <p className="text-lg text-prune-doux">On cherche des films…</p> : error ? null : empty}
          </div>
        )}
      </div>

      {error && (
        <div className="flex flex-col gap-2">
          <Message kind="error">{error}</Message>
          {!top && <Button variant="soft" onClick={() => void refill()}>Réessayer</Button>}
        </div>
      )}

      <div className="flex justify-center gap-6">
        <button
          type="button"
          onClick={() => decide(-1)}
          disabled={!top}
          aria-label="Non merci"
          className="grid size-16 place-items-center rounded-full bg-white text-prune transition active:scale-90 disabled:opacity-40"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => decide(1)}
          disabled={!top}
          aria-label="J'ai envie"
          className="grid size-16 place-items-center rounded-full bg-prune text-white transition active:scale-90 disabled:opacity-40"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z" />
          </svg>
        </button>
      </div>

      {match && <MatchOverlay {...source.describe(match)} onClose={() => setMatch(null)} />}
    </div>
  )
}

/** Carte du dessus : on la fait glisser à droite (envie) ou à gauche (non). */
function DraggableCard({ children, exit, onRelease }: { children: ReactNode; exit: 0 | 1 | -1; onRelease: (dir: 1 | -1) => void }) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef<number | null>(null)

  function down(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return // les boutons de la carte restent cliquables
    e.currentTarget.setPointerCapture(e.pointerId)
    startX.current = e.clientX
    setDragging(true)
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (startX.current !== null) setDx(e.clientX - startX.current)
  }
  function up() {
    startX.current = null
    setDragging(false)
    if (Math.abs(dx) > THRESHOLD) onRelease(dx > 0 ? 1 : -1)
    else setDx(0)
  }

  const x = exit ? exit * 600 : dx
  const hint = exit || (Math.abs(dx) > 30 ? Math.sign(dx) : 0)

  return (
    <div
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
      style={{ transform: `translateX(${x}px) rotate(${x / 18}deg)`, transition: dragging ? 'none' : `transform ${EXIT_MS}ms ease-out` }}
    >
      {children}
      {hint !== 0 && (
        <span
          aria-hidden="true"
          className={`absolute top-6 rounded-full px-5 py-2 text-2xl font-bold ${hint > 0 ? 'left-6 -rotate-12 bg-menthe' : 'right-6 rotate-12 bg-white'}`}
          style={{ opacity: exit ? 1 : Math.min(1, Math.abs(dx) / THRESHOLD) }}
        >
          {hint > 0 ? 'Envie !' : 'Bof'}
        </span>
      )}
    </div>
  )
}
