import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Tables } from './database.types'
import { supabase } from './supabase'

export type Member = Tables<'members'>

type AuthState = {
  session: Session | null
  /** Les membres du couple par ordre d'arrivée : index 0 = personne A, 1 = personne B (sert aux couleurs). */
  members: Member[]
  me: Member | null
  partner: Member | null
  /** Code à transmettre tant que le couple n'est pas complet, null ensuite. */
  inviteCode: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  /** Encre d'une personne : 'a' pour le créateur du couple, 'b' pour l'autre. */
  inkOf: (userId: string) => 'a' | 'b'
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = on ne sait pas encore si quelqu'un est connecté
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [members, setMembers] = useState<Member[]>([])
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Émet INITIAL_SESSION dès l'abonnement. Pas d'appel Supabase ici (risque de blocage) : on stocke juste la session.
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const refresh = useCallback(async () => {
    if (!userId) {
      setMembers([])
      setInviteCode(null)
      setLoaded(true)
      return
    }
    const [m, c] = await Promise.all([
      supabase.from('members').select('*').order('joined_at'),
      supabase.from('couples').select('invite_code').maybeSingle(),
    ])
    // En cas d'erreur réseau on ne vide pas le couple : sinon l'app proposerait d'en créer un nouveau
    if (m.error || c.error) {
      setError((m.error ?? c.error)!.message)
    } else {
      setError(null)
      setMembers(m.data)
      setInviteCode(c.data?.invite_code ?? null)
    }
    setLoaded(true)
  }, [userId])

  useEffect(() => {
    if (session === undefined) return
    setLoaded(false)
    void refresh()
  }, [session, refresh])

  // Temps réel : l'arrivée de l'autre membre (ou un changement de prénom) met l'écran à jour
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => void refresh())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  const me = members.find((m) => m.user_id === userId) ?? null
  const partner = members.find((m) => m.user_id !== userId) ?? null

  return (
    <AuthContext.Provider
      value={{
        session: session ?? null,
        members,
        me,
        partner,
        inviteCode,
        loading: session === undefined || !loaded,
        error,
        refresh,
        inkOf: (id) => (members[0]?.user_id === id ? 'a' : 'b'),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
