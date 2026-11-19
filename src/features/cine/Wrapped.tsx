import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Overprint, Stars } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { genreName, imageUrl, type Movie } from '../../lib/tmdb'
import { agreementLabel, type wrappedStats } from './stats'

type Stats = ReturnType<typeof wrappedStats<Movie>>
type Slide = { bg: string; content: ReactNode }

/** Wrapped ciné : récap de l'année en « stories ». Toucher à droite = suivant, à gauche = précédent. */
export function Wrapped({ stats, onClose }: { stats: Stats; onClose: () => void }) {
  const { me, partner } = useAuth()
  const ref = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const hours = Math.floor(stats.minutes / 60)
  const poster = (m: Movie) => imageUrl(m.posterPath, 'w342')
  const pair = (a: number, b: number) => (
    <div className="flex flex-col items-center gap-1">
      <p className="flex items-center gap-2 text-lg">
        {me?.display_name} <Stars value={a} />
      </p>
      <p className="flex items-center gap-2 text-lg">
        {partner?.display_name} <Stars value={b} />
      </p>
    </div>
  )

  const slides: Slide[] = [
    {
      bg: 'bg-lilas',
      content: (
        <>
          <Overprint className="h-48 w-72">
            <p className="text-7xl font-bold">{stats.year}</p>
          </Overprint>
          <p className="text-3xl font-bold">Votre année ciné</p>
        </>
      ),
    },
    {
      bg: 'bg-peche',
      content: (
        <>
          <p className="text-8xl font-bold">{stats.count}</p>
          <p className="text-3xl font-semibold">film{stats.count > 1 ? 's' : ''} vu{stats.count > 1 ? 's' : ''} ensemble</p>
        </>
      ),
    },
    {
      bg: 'bg-menthe',
      content: (
        <>
          <p className="text-8xl font-bold">{hours} h</p>
          <p className="text-3xl font-semibold">devant l’écran, côte à côte</p>
          {hours >= 24 && <p className="text-lg">Soit plus de {Math.floor(hours / 24)} jour{hours >= 48 ? 's' : ''} entier{hours >= 48 ? 's' : ''}.</p>}
        </>
      ),
    },
    ...(stats.favoriteGenre
      ? [{ bg: 'bg-beurre', content: <><p className="text-2xl font-medium">Votre genre de l’année</p><p className="text-6xl font-bold">{genreName(stats.favoriteGenre)}</p></> }]
      : []),
    ...(stats.bestRated
      ? [
          {
            bg: 'bg-menthe',
            content: (
              <>
                <p className="text-2xl font-medium">Le préféré de vous deux</p>
                {poster(stats.bestRated.movie) && <img src={poster(stats.bestRated.movie)!} alt="" className="h-64 rounded-[24px] object-cover" />}
                <p className="text-3xl font-bold">{stats.bestRated.movie.title}</p>
                {pair(stats.bestRated.a, stats.bestRated.b)}
              </>
            ),
          },
        ]
      : []),
    ...(stats.biggestDisagreement
      ? [
          {
            bg: 'bg-peche',
            content: (
              <>
                <p className="text-2xl font-medium">Le plus gros désaccord</p>
                {poster(stats.biggestDisagreement.movie) && <img src={poster(stats.biggestDisagreement.movie)!} alt="" className="h-64 rounded-[24px] object-cover" />}
                <p className="text-3xl font-bold">{stats.biggestDisagreement.movie.title}</p>
                {pair(stats.biggestDisagreement.a, stats.biggestDisagreement.b)}
                <p className="text-lg">Le débat n’est pas clos.</p>
              </>
            ),
          },
        ]
      : []),
    ...(stats.agreement !== null
      ? [
          {
            bg: 'bg-lilas',
            content: (
              <>
                <Overprint className="h-44 w-64">
                  <p className="text-6xl font-bold">{stats.agreement} %</p>
                </Overprint>
                <p className="text-3xl font-semibold">d’accord sur vos notes</p>
                <p className="text-lg text-prune-doux">{agreementLabel(stats.agreement)}</p>
              </>
            ),
          },
        ]
      : []),
    {
      bg: 'bg-beurre',
      content:
        stats.betrayals > 0 ? (
          <>
            <p className="text-8xl font-bold">{stats.betrayals}</p>
            <p className="text-3xl font-semibold">trahison{stats.betrayals > 1 ? 's' : ''} sur les séries</p>
            <p className="text-lg">On ne citera personne. (Si, en fait : regardez le compteur.)</p>
          </>
        ) : (
          <>
            <p className="text-6xl font-bold">0 trahison</p>
            <p className="text-2xl font-semibold">Aucune série regardée en douce. Respect.</p>
          </>
        ),
    },
    {
      bg: 'bg-lilas',
      content: (
        <>
          <p className="text-4xl font-bold">À l’année prochaine</p>
          <p className="text-lg text-prune-doux">D’ici là, il reste des films à swiper.</p>
        </>
      ),
    },
  ]

  const go = (delta: number) => {
    const next = index + delta
    if (next >= slides.length) ref.current?.close()
    else setIndex(Math.max(0, next))
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      aria-label={`Votre année ciné ${stats.year}`}
      className={`m-0 h-dvh max-h-none w-full max-w-none p-0 text-prune transition-colors duration-300 backdrop:bg-transparent ${slides[index].bg}`}
    >
      <div className="mx-auto flex h-full max-w-sm flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <ol className="flex flex-1 gap-1" aria-label={`Étape ${index + 1} sur ${slides.length}`}>
            {slides.map((_, i) => (
              <li key={i} className={`h-1.5 flex-1 rounded-full ${i <= index ? 'bg-prune' : 'bg-prune/20'}`} />
            ))}
          </ol>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Fermer" className="grid size-11 place-items-center rounded-full bg-white/60">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {/* Toucher la zone : à gauche on revient, à droite on avance (les boutons du bas font pareil, au clavier) */}
        <div
          aria-live="polite"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            go(e.clientX - r.left < r.width / 3 ? -1 : 1)
          }}
          className="flex flex-1 cursor-pointer flex-col items-center justify-center text-center select-none"
        >
          <div key={index} className="flex flex-col items-center gap-5 motion-safe:animate-[pop_420ms_ease-out]">
            {slides[index].content}
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => go(-1)} disabled={index === 0} className="min-h-12 flex-1 rounded-full bg-white/60 font-semibold disabled:opacity-0">
            Précédent
          </button>
          <button type="button" onClick={() => go(1)} className="min-h-12 flex-1 rounded-full bg-prune font-semibold text-white">
            {index === slides.length - 1 ? 'Fermer' : 'Suivant'}
          </button>
        </div>
      </div>
    </dialog>
  )
}

