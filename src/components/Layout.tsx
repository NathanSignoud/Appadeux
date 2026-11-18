import { Outlet } from 'react-router'
import { TabBar } from './TabBar'

export function Layout() {
  return (
    <>
      {/* pb-32 : le contenu ne passe jamais sous la barre d'onglets flottante */}
      <main className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-32">
        <Outlet />
      </main>
      <TabBar />
    </>
  )
}
