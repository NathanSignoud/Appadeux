import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { Soon } from './components/Soon'
import { Button } from './components/ui'
import { Accueil } from './features/accueil/Accueil'
import { Connexion } from './features/auth/Connexion'
import { Cine } from './features/cine/Cine'
import { CineSwipe } from './features/cine/CineSwipe'
import { Vus } from './features/cine/Vus'
import { Watchlist } from './features/cine/Watchlist'
import { Bienvenue } from './features/couple/Bienvenue'
import { Parametres } from './features/plus/Parametres'
import { Plus } from './features/plus/Plus'
import { useAuth } from './lib/auth'

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
        </Route>
        <Route path="calendrier" element={<Soon title="Agenda" phase={2} />} />
        <Route path="listes" element={<Soon title="Listes" phase={3} />} />
        <Route path="plus" element={<Plus />} />
        <Route path="depenses" element={<Soon title="Dépenses" phase={3} />} />
        <Route path="alphabet" element={<Soon title="Alphabet des dates" phase={4} />} />
        <Route path="passeport" element={<Soon title="Passeport ciné" phase={4} />} />
        <Route path="parametres" element={<Parametres />} />
        <Route path="*" element={<Accueil />} />
      </Route>
    </Routes>
  )
}
