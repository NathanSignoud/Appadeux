import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { TabBar } from './TabBar'

export function Layout() {
  return (
    <>
      {/* pb-32 : le contenu ne passe jamais sous la barre d'onglets flottante */}
      <main className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-32">
        {/* Pages chargées à la demande : la barre d'onglets reste affichée pendant le chargement */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
    </>
  )
}
