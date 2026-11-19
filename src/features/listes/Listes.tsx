import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { EmptyState, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { frenchError, supabase } from '../../lib/supabase'
import { remaining, useLists } from './hooks'
import { ListSheet } from './ListSheet'

// Couleur et coin « guimauve » tournent d'une liste à l'autre
const looks = ['bg-beurre rounded-[28px_28px_28px_10px]', 'bg-menthe rounded-[28px_28px_10px_28px]', 'bg-peche rounded-[10px_28px_28px_28px]', 'bg-white rounded-[28px_10px_28px_28px]']

type Counted = { list_items: { done: boolean }[] }
const todoText = (l: Counted) => (l.list_items.length === 0 ? 'Vide' : remaining(l) === 0 ? 'Tout est coché' : `${remaining(l)} à faire`)
const ideasText = (l: Counted) => (l.list_items.length === 0 ? 'Vide' : `${remaining(l)} idée${remaining(l) > 1 ? 's' : ''}`)

export function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="3" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function Listes() {
  const { me, partner } = useAuth()
  const { data, loading, error } = useLists()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const navigate = useNavigate()

  const shared = data.filter((l) => !l.owner_id)
  const secret = data.filter((l) => l.owner_id)

  async function createGiftList() {
    const { data, error } = await supabase
      .from('lists')
      .insert({ title: `Idées cadeaux pour ${partner!.display_name}`, owner_id: me!.user_id })
      .select('id')
      .single()
    if (error) setCreateError(frenchError(error))
    else navigate(`/listes/${data.id}`)
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Listes</h1>
        <button type="button" onClick={() => setSheetOpen(true)} className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
          Nouvelle
        </button>
      </header>

      {(error || createError) && <Message kind="error">{error ?? createError}</Message>}

      {!loading && shared.length === 0 && (
        <EmptyState
          action={
            <button type="button" onClick={() => setSheetOpen(true)} className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
              Créer une liste
            </button>
          }
        >
          Pas encore de liste à deux. Les courses, les choses à faire, les envies du week-end…
        </EmptyState>
      )}

      <ul className="grid grid-cols-2 gap-3">
        {shared.map((l, i) => (
          <li key={l.id}>
            <Link to={`/listes/${l.id}`} className={`flex min-h-28 flex-col gap-1 p-4 transition active:scale-[0.97] ${looks[i % looks.length]}`}>
              <span className="text-lg leading-tight font-semibold break-words">{l.title}</span>
              <span className="mt-auto text-prune-doux">{todoText(l)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 px-1 text-xl font-bold">
          <LockIcon /> Rien que pour toi
        </h2>
        {secret.map((l) => (
          <Link
            key={l.id}
            to={`/listes/${l.id}`}
            className="flex min-h-16 items-center justify-between gap-3 rounded-[28px] border-2 border-dashed border-violet bg-white/60 px-5 py-3 active:scale-[0.98]"
          >
            <span className="text-lg font-semibold">{l.title}</span>
            <span className="shrink-0 text-prune-doux">{ideasText(l)}</span>
          </Link>
        ))}
        {!loading && secret.length === 0 && (
          <div className="flex flex-col gap-3 rounded-[28px] border-2 border-dashed border-violet bg-white/60 p-5">
            <p className="text-lg">
              Note ici tes idées de cadeaux pour {partner?.display_name}. Personne d’autre que toi ne peut voir cette liste, {partner?.display_name} non plus.
            </p>
            <button type="button" onClick={createGiftList} className="min-h-11 self-start rounded-full bg-prune px-5 font-semibold text-white active:scale-95">
              Créer ma liste cadeaux
            </button>
          </div>
        )}
      </section>

      <ListSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}
