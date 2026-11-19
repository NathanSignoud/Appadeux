import type { ReactNode } from 'react'
import { imageUrl, movieMeta, type Movie } from '../../lib/tmdb'

/** Ligne de film (watchlist, vus) : affiche, titre, infos, et ce qu'on veut en dessous. */
export function MovieRow({ movie, children }: { movie: Movie; children?: ReactNode }) {
  const poster = imageUrl(movie.posterPath, 'w185')
  return (
    <li className="flex gap-3 rounded-[28px] bg-white p-3">
      {poster ? (
        <img src={poster} alt="" loading="lazy" className="h-28 w-[4.7rem] shrink-0 rounded-2xl object-cover" />
      ) : (
        <span aria-hidden="true" className="h-28 w-[4.7rem] shrink-0 rounded-2xl bg-lilas-fonce" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-lg leading-tight font-semibold">{movie.title}</h3>
        <p className="text-prune-doux">{movieMeta(movie)}</p>
        {children}
      </div>
    </li>
  )
}

/** Petit badge riso : deux pastilles d'encre superposées. */
export function MatchBadge() {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold">
      <span aria-hidden="true" className="relative isolate h-3.5 w-5">
        <span className="absolute left-0 size-3.5 rounded-full bg-encre-a mix-blend-multiply dark:mix-blend-screen" />
        <span className="absolute right-0 size-3.5 rounded-full bg-encre-b mix-blend-multiply dark:mix-blend-screen" />
      </span>
      Match
    </span>
  )
}
