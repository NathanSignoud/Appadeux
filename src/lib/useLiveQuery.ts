import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { frenchError, supabase } from './supabase'

type Result<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

/**
 * Lit une requête Supabase et la relit dès qu'une des tables change (chez moi ou chez l'autre).
 * Pattern de données du projet : la RLS filtre, le Realtime prévient, on recharge.
 * shortcut: recharge toute la requête à chaque changement ; suffisant pour deux personnes, à affiner si une liste dépasse quelques centaines de lignes.
 */
export function useLiveQuery<T>(tables: string[], fetcher: () => Result<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const id = useId()

  const reload = useCallback(async () => {
    const { data, error } = await fetcherRef.current()
    if (error) setError(frenchError(error))
    else {
      setError(null)
      setData(data ?? [])
    }
    setLoading(false)
  }, [])

  const tablesKey = tables.join(',')
  useEffect(() => {
    void reload()
    const channel = supabase.channel(`live${id}`)
    for (const table of tablesKey.split(',')) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => void reload())
    }
    channel.subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tablesKey, reload, id])

  return { data, loading, error, reload }
}
