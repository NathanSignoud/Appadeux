import { useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Message } from '../../components/ui'
import { frenchError, supabase } from '../../lib/supabase'
import { useList, type ListItem } from './hooks'
import { ListSheet } from './ListSheet'
import { LockIcon } from './Listes'

export function ListeDetail() {
  const { id = '' } = useParams()
  return <Detail key={id} id={id} /> // key : on repart de zéro en changeant de liste
}

type Drag = { id: string; from: number; startY: number; dy: number; rowH: number }
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n))

function Detail({ id }: { id: string }) {
  const { data, loading, error, reload } = useList(id)
  const list = data[0]
  // Changements affichés tout de suite, en attendant la confirmation du serveur
  const [optimistic, setOptimistic] = useState<Record<string, Partial<ListItem>>>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)

  if (loading) return null
  if (!list) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg">Cette liste n’existe plus.</p>
        <Link to="/listes" className="min-h-11 rounded-full bg-prune px-5 py-2.5 font-semibold text-white">
          Retour aux listes
        </Link>
      </div>
    )
  }

  const items = list.list_items.map((i) => ({ ...i, ...optimistic[i.id] })).sort((a, b) => a.position - b.position)
  const todo = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)

  async function patch(item: ListItem, fields: Partial<Pick<ListItem, 'text' | 'done' | 'position'>>) {
    setOptimistic((o) => ({ ...o, [item.id]: { ...o[item.id], ...fields } }))
    const { error } = await supabase.from('list_items').update(fields).eq('id', item.id)
    if (error) setActionError(frenchError(error))
    else await reload()
    setOptimistic((o) => {
      const next = { ...o }
      delete next[item.id]
      return next
    })
  }

  async function remove(item: ListItem) {
    setEditing(null)
    const { error } = await supabase.from('list_items').delete().eq('id', item.id)
    if (error) setActionError(frenchError(error))
  }

  async function clearDone() {
    if (!confirm(`Retirer les ${done.length} éléments cochés ?`)) return
    const { error } = await supabase.from('list_items').delete().eq('list_id', id).eq('done', true)
    if (error) setActionError(frenchError(error))
  }

  /** Déplace todo[from] à l'index `to` : nouvelle position = milieu de ses nouveaux voisins. */
  function move(from: number, to: number) {
    if (to === from) return
    const item = todo[from]
    const rest = todo.filter((i) => i.id !== item.id)
    const prev = rest[to - 1]
    const next = rest[to]
    const position = prev && next ? (prev.position + next.position) / 2 : prev ? prev.position + 1 : next.position - 1
    void patch(item, { position })
  }

  const target = drag ? clamp(drag.from + Math.round(drag.dy / drag.rowH), todo.length - 1) : -1
  function shiftOf(index: number) {
    if (!drag || index === drag.from) return 0
    if (drag.from < target && index > drag.from && index <= target) return -drag.rowH
    if (target < drag.from && index >= target && index < drag.from) return drag.rowH
    return 0
  }

  const handle = (item: ListItem, index: number) => ({
    onPointerDown(e: PointerEvent<HTMLButtonElement>) {
      e.currentTarget.setPointerCapture(e.pointerId)
      const row = e.currentTarget.closest('li')!
      setDrag({ id: item.id, from: index, startY: e.clientY, dy: 0, rowH: row.offsetHeight + 8 }) // + gap-2
    },
    onPointerMove(e: PointerEvent<HTMLButtonElement>) {
      if (drag?.id === item.id) setDrag({ ...drag, dy: e.clientY - drag.startY })
    },
    onPointerUp() {
      if (drag?.id !== item.id) return
      setDrag(null)
      move(drag.from, target)
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        move(index, clamp(index + (e.key === 'ArrowUp' ? -1 : 1), todo.length - 1))
      }
    },
  })

  // index = rang dans « à faire » ; -1 pour les cochés (ni déplaçables, ni décalés pendant un glisser)
  const row = (item: ListItem, index: number) => {
    const dragging = drag?.id === item.id
    return (
      <li
        key={item.id}
        style={{ transform: `translateY(${dragging ? drag.dy : shiftOf(index)}px)` }}
        className={`flex min-h-14 items-center gap-1 rounded-2xl bg-white pr-1 ${dragging ? 'relative z-10 shadow-lg shadow-prune/15' : drag ? 'transition-transform duration-150' : ''}`}
      >
        <label className="relative grid size-12 shrink-0 place-items-center">
          <input
            type="checkbox"
            checked={item.done}
            onChange={(e) => patch(item, { done: e.target.checked })}
            aria-label={item.text}
            className="peer size-7 appearance-none rounded-full border-[3px] border-lilas-fonce bg-white transition-colors checked:border-violet checked:bg-violet"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pointer-events-none absolute size-4 opacity-0 peer-checked:opacity-100">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </label>
        {editing === item.id ? (
          <EditItem item={item} onSave={(text) => {
              setEditing(null)
              if (text !== item.text) void patch(item, { text })
            }} onCancel={() => setEditing(null)} onDelete={() => remove(item)} />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(item.id)}
            className={`min-h-11 flex-1 py-2 text-left text-lg break-words ${item.done ? 'text-prune-doux line-through' : ''}`}
          >
            {item.text}
          </button>
        )}
        {!item.done && editing !== item.id && (
          <button
            type="button"
            aria-label={`Déplacer ${item.text} (flèches haut et bas)`}
            className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-full text-prune-doux active:cursor-grabbing"
            {...handle(item, index)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {[6, 12, 18].map((y) => [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" />))}
            </svg>
          </button>
        )}
      </li>
    )
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link to="/listes" className="flex min-h-11 items-center gap-1 self-start font-medium text-prune-doux">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
          Listes
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl leading-tight font-bold break-words">{list.title}</h1>
          <button type="button" onClick={() => setSheetOpen(true)} className="min-h-11 shrink-0 rounded-full bg-white px-4 font-semibold active:scale-95">
            Modifier
          </button>
        </div>
        {list.owner_id && (
          <p className="flex items-center gap-2 font-medium text-violet">
            <LockIcon /> Visible seulement par toi
          </p>
        )}
      </header>

      <AddItem listId={id} onAdded={reload} onError={setActionError} />
      {(error || actionError) && <Message kind="error">{error ?? actionError}</Message>}

      {items.length === 0 && <p className="px-1 text-lg text-prune-doux">Liste vide. Ajoute le premier élément juste au-dessus.</p>}

      <ul className="flex flex-col gap-2">{todo.map(row)}</ul>

      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold text-prune-doux">Cochés ({done.length})</h2>
            <button type="button" onClick={clearDone} className="min-h-11 rounded-full px-3 font-semibold text-prune-doux active:scale-95">
              Tout retirer
            </button>
          </div>
          <ul className="flex flex-col gap-2 opacity-80">{done.map((i) => row(i, -1))}</ul>
        </section>
      )}

      <ListSheet open={sheetOpen} list={list} onClose={() => setSheetOpen(false)} />
    </>
  )
}

/** Champ d'ajout : reste ouvert et garde le focus pour enchaîner (courses). */
function AddItem({ listId, onAdded, onError }: { listId: string; onAdded: () => void; onError: (e: string) => void }) {
  const [text, setText] = useState('')

  async function add(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setText('')
    const { error } = await supabase.from('list_items').insert({ list_id: listId, text: value })
    if (error) {
      setText(value)
      onError(frenchError(error))
    } else onAdded()
  }

  return (
    <form onSubmit={add} className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={200}
        placeholder="Ajouter…"
        aria-label="Nouvel élément"
        enterKeyHint="done"
        className="min-h-12 min-w-0 flex-1 rounded-full bg-white px-5 text-lg outline-none focus-visible:ring-3 focus-visible:ring-violet"
      />
      <button type="submit" aria-label="Ajouter" className="grid size-12 shrink-0 place-items-center rounded-full bg-prune text-white active:scale-95">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </form>
  )
}

function EditItem({ item, onSave, onCancel, onDelete }: { item: ListItem; onSave: (text: string) => void; onCancel: () => void; onDelete: () => void }) {
  const [text, setText] = useState(item.text)
  const save = () => (text.trim() ? onSave(text.trim()) : onCancel())
  return (
    <>
      <input
        autoFocus
        value={text}
        maxLength={200}
        aria-label="Modifier l’élément"
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') onCancel()
        }}
        className="min-h-11 min-w-0 flex-1 rounded-xl bg-lilas px-3 text-lg outline-none"
      />
      <button
        type="button"
        // pointerdown : sinon le champ perd le focus et enregistre avant la suppression
        onPointerDown={(e) => e.preventDefault()}
        onClick={onDelete}
        aria-label={`Supprimer ${item.text}`}
        className="grid size-11 shrink-0 place-items-center rounded-full text-erreur active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
        </svg>
      </button>
    </>
  )
}
