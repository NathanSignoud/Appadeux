import { NavLink, Outlet } from 'react-router'

const tabs = [
  { to: '/cine', label: 'Swiper', end: true },
  { to: '/cine/watchlist', label: 'Watchlist', end: false },
  { to: '/cine/vus', label: 'Vus', end: false },
]

export function Cine() {
  return (
    <>
      <h1 className="text-3xl font-bold">Ciné</h1>
      <nav aria-label="Sections du ciné" className="flex gap-1 rounded-full bg-white p-1">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex min-h-11 flex-1 items-center justify-center rounded-full font-semibold transition-colors ${isActive ? 'bg-lilas-fonce text-prune' : 'text-prune-doux'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  )
}
