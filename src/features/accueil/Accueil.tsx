import { Link } from 'react-router'
import { Avatar, Overprint } from '../../components/ui'
import { useAuth } from '../../lib/auth'

// Accueil de la phase 0 : le vrai tableau de bord (compte à rebours, solde…) arrive en phase 2.
const raccourcis = [
  { to: '/cine', titre: 'Ciné', texte: 'Swiper des films à deux', fond: 'bg-peche', forme: 'rounded-[28px_28px_28px_10px]' },
  { to: '/calendrier', titre: 'Agenda', texte: 'Nos dates, nos absences', fond: 'bg-menthe', forme: 'rounded-[28px_28px_10px_28px]' },
  { to: '/listes', titre: 'Listes', texte: 'Courses, envies, cadeaux', fond: 'bg-beurre', forme: 'rounded-[28px]' },
  { to: '/alphabet', titre: 'Alphabet', texte: 'Un date par lettre', fond: 'bg-white', forme: 'rounded-[10px_28px_28px_28px]' },
]

export function Accueil() {
  const { me, partner, inkOf } = useAuth()
  if (!me || !partner) return null

  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coucou {me.display_name}</h1>
        <div className="flex gap-1.5">
          <Avatar name={me.display_name} ink={inkOf(me.user_id)} />
          <Avatar name={partner.display_name} ink={inkOf(partner.user_id)} />
        </div>
      </header>

      <Overprint className="h-48">
        <p className="text-4xl font-bold">
          {me.display_name} & {partner.display_name}
        </p>
        <p className="text-lg font-medium">votre petit coin à deux</p>
      </Overprint>

      <nav aria-label="Raccourcis" className="grid grid-cols-2 gap-3">
        {raccourcis.map((r) => (
          <Link key={r.to} to={r.to} className={`flex min-h-28 flex-col justify-end gap-1 p-4 transition active:scale-[0.97] ${r.fond} ${r.forme}`}>
            <span className="text-xl font-semibold">{r.titre}</span>
            <span className="leading-tight text-prune-doux">{r.texte}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
