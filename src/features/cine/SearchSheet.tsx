import { useEffect, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { Field, Message } from '../../components/ui'
import { imageUrl, type SearchResult } from '../../lib/tmdb'

/** Recherche TMDB (films ou séries). onPick renvoie un message d'erreur, ou null si c'est ajouté. */
type Props = {
  open: boolean
  onClose: () => void
  title: string
  label: string
  existing: Set<string>
  search: (query: string) => Promise<{ results: SearchResult[] }>
  onPick: (r: SearchResult) => Promise<string | null>
}

export function SearchSheet(props: Props) {
  return (
    <Sheet open={props.open} onClose={props.onClose} title={props.title}>
      <Search {...props} />
    </Sheet>
  )
}

function Search({ onClose, existing, label, search, onPick }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [adding, setAdding] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    let stale = false // une réponse lente d'une ancienne frappe ne doit pas écraser la nouvelle
    const timer = setTimeout(() => {
      search(query)
        .then((r) => !stale && setResults(r.results))
        .catch((e: Error) => !stale && setError(e.message))
    }, 350)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [query, search])

  async function add(r: SearchResult) {
    setAdding(r.id)
    setError(null)
    try {
      const message = await onPick(r)
      if (message) setError(message)
      else onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="flex max-h-[70dvh] flex-col gap-4">
      <Field label={label} type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <Message kind="error">{error}</Message>}
      <ul className="flex flex-col gap-2 overflow-y-auto">
        {results.map((r) => {
          const already = existing.has(String(r.id))
          return (
            <li key={r.id}>
              <button
                type="button"
                disabled={already || adding !== null}
                onClick={() => add(r)}
                className="flex w-full items-center gap-3 rounded-[20px] bg-white p-2 text-left disabled:opacity-60"
              >
                {imageUrl(r.posterPath, 'w92') ? (
                  <img src={imageUrl(r.posterPath, 'w92')!} alt="" className="h-16 w-11 rounded-xl object-cover" />
                ) : (
                  <span className="h-16 w-11 rounded-xl bg-lilas-fonce" aria-hidden="true" />
                )}
                <span className="flex flex-col">
                  <span className="font-semibold">{r.title}</span>
                  <span className="text-prune-doux">
                    {[r.year, already ? 'déjà dans la liste' : adding === r.id ? 'ajout…' : null].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
