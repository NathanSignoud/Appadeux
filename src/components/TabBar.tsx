import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'

const icon = (d: ReactNode) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

// « matches » : les routes pour lesquelles l'onglet est allumé (Plus regroupe plusieurs pages)
const tabs = [
  { to: '/', label: 'Accueil', matches: ['/'], icon: icon(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /></>) },
  { to: '/cine', label: 'Ciné', matches: ['/cine'], icon: icon(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4" /></>) },
  { to: '/calendrier', label: 'Agenda', matches: ['/calendrier'], icon: icon(<><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>) },
  { to: '/listes', label: 'Listes', matches: ['/listes'], icon: icon(<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />) },
  { to: '/plus', label: 'Plus', matches: ['/plus', '/depenses', '/alphabet', '/passeport', '/parametres'], icon: icon(<path d="M5 12h.01M12 12h.01M19 12h.01" />) },
]

export function TabBar() {
  const { pathname } = useLocation()
  const isActive = (matches: string[]) => matches.some((m) => (m === '/' ? pathname === '/' : pathname.startsWith(m)))

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 justify-around rounded-full bg-white p-2 shadow-[0_8px_30px_-12px_rgb(59_42_85/0.35)]"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.matches)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            className={`flex min-w-14 flex-col items-center gap-0.5 rounded-full px-2.5 py-1.5 text-xs transition-colors ${
              active ? 'bg-lilas-fonce font-semibold text-prune' : 'font-medium text-prune-doux'
            }`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
