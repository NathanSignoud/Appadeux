import { Link } from 'react-router'

const pages = [
  { to: '/jardin', titre: 'Notre jardin', texte: 'La plante qui pousse avec vos moments à deux' },
  { to: '/bocal', titre: 'Le bocal à mots doux', texte: 'Un mot glissé, un mot pioché par jour' },
  { to: '/paris', titre: 'Paris et gages', texte: 'Qui a gagné, qui doit un massage' },
  { to: '/bons', titre: 'Bons à gratter', texte: 'Petit-déj au lit, joker dispute…' },
  { to: '/depenses', titre: 'Dépenses', texte: 'Qui doit combien à qui' },
  { to: '/alphabet', titre: 'Alphabet des dates', texte: 'De A à Z, chacun son tour' },
  { to: '/passeport', titre: 'Passeport ciné', texte: 'Les pays et les décennies de nos films' },
  { to: '/parametres', titre: 'Paramètres', texte: 'Prénom, apparence, abonnements, mot de passe' },
]

export function Plus() {
  return (
    <>
      <h1 className="text-3xl font-bold">Plus</h1>
      <ul className="flex flex-col gap-3">
        {pages.map((p) => (
          <li key={p.to}>
            <Link to={p.to} className="flex min-h-16 flex-col justify-center rounded-[28px] bg-white px-5 py-3 transition active:scale-[0.98]">
              <span className="text-lg font-semibold">{p.titre}</span>
              <span className="text-prune-doux">{p.texte}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
