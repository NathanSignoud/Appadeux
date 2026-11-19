import { lazy, type ComponentType } from 'react'
import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { Button } from './components/ui'
import { Accueil } from './features/accueil/Accueil'
import { Connexion } from './features/auth/Connexion'
import { Bienvenue } from './features/couple/Bienvenue'
import { useAuth } from './lib/auth'

// Chaque page est chargée à la demande (l'accueil, lui, est dans le paquet principal) : premier affichage plus rapide sur mobile.
// Le passeport embarque la carte du monde (~40 Ko compressés).
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => lazy(() => load().then((m) => ({ default: m[name] })))
const Alphabet = page(() => import('./features/alphabet/Alphabet'), 'Alphabet')
const LettreDetail = page(() => import('./features/alphabet/LettreDetail'), 'LettreDetail')
const Calendrier = page(() => import('./features/calendrier/Calendrier'), 'Calendrier')
const MonthView = page(() => import('./features/calendrier/MonthView'), 'MonthView')
const UpcomingView = page(() => import('./features/calendrier/UpcomingView'), 'UpcomingView')
const Cine = page(() => import('./features/cine/Cine'), 'Cine')
const CineSwipe = page(() => import('./features/cine/CineSwipe'), 'CineSwipe')
const Vus = page(() => import('./features/cine/Vus'), 'Vus')
const Series = page(() => import('./features/cine/Series'), 'Series')
const Watchlist = page(() => import('./features/cine/Watchlist'), 'Watchlist')
const Depenses = page(() => import('./features/depenses/Depenses'), 'Depenses')
const ListeDetail = page(() => import('./features/listes/ListeDetail'), 'ListeDetail')
const Listes = page(() => import('./features/listes/Listes'), 'Listes')
const Parametres = page(() => import('./features/plus/Parametres'), 'Parametres')
const Plus = page(() => import('./features/plus/Plus'), 'Plus')
const Passeport = page(() => import('./features/passeport/Passeport'), 'Passeport')
const Jardin = page(() => import('./features/jardin/Jardin'), 'Jardin')
const Bocal = page(() => import('./features/bocal/Bocal'), 'Bocal')
const Paris = page(() => import('./features/paris/Paris'), 'Paris')
const Bons = page(() => import('./features/bons/Bons'), 'Bons')

export default function App() {
  const { loading, error, session, me, partner, refresh } = useAuth()

  // Garde d'accès : connexion → couple complet → app. Rien n'est visible sans être membre d'un couple à deux.
  if (loading) return <div className="blob mx-auto mt-[40dvh] size-16 animate-pulse bg-violet" aria-label="Chargement" />
  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-5 text-center">
        <p className="text-lg">Impossible de joindre le serveur. Vérifie ta connexion internet.</p>
        <Button onClick={refresh}>Réessayer</Button>
      </main>
    )
  }
  if (!session) return <Connexion />
  if (!me || !partner) return <Bienvenue />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Accueil />} />
        <Route path="cine" element={<Cine />}>
          <Route index element={<CineSwipe />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="vus" element={<Vus />} />
          <Route path="series" element={<Series />} />
        </Route>
        <Route path="calendrier" element={<Calendrier />}>
          <Route index element={<MonthView />} />
          <Route path="a-venir" element={<UpcomingView />} />
        </Route>
        <Route path="listes" element={<Listes />} />
        <Route path="listes/:id" element={<ListeDetail />} />
        <Route path="plus" element={<Plus />} />
        <Route path="depenses" element={<Depenses />} />
        <Route path="alphabet" element={<Alphabet />} />
        <Route path="alphabet/:letter" element={<LettreDetail />} />
        <Route path="passeport" element={<Passeport />} />
        <Route path="jardin" element={<Jardin />} />
        <Route path="bocal" element={<Bocal />} />
        <Route path="paris" element={<Paris />} />
        <Route path="bons" element={<Bons />} />
        <Route path="parametres" element={<Parametres />} />
        <Route path="*" element={<Accueil />} />
      </Route>
    </Routes>
  )
}
