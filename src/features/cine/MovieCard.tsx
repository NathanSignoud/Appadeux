import { useState } from 'react'
import { imageUrl, movieMeta, type Movie } from '../../lib/tmdb'

export function MovieCard({ movie }: { movie: Movie }) {
  const [open, setOpen] = useState(false)
  const poster = imageUrl(movie.posterPath, 'w500')

  return (
    <article className="relative h-full overflow-hidden rounded-[32px] bg-lilas-fonce shadow-[0_16px_40px_-20px_rgb(59_42_85/0.5)]">
      {poster ? (
        <img src={poster} alt={`Affiche de ${movie.title}`} draggable={false} className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center p-8 text-center text-2xl font-semibold">{movie.title}</div>
      )}
      <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1 rounded-[24px] bg-white/95 px-4 pt-3 pb-1">
        <h3 className="text-xl leading-tight font-semibold">{movie.title}</h3>
        <p className="text-prune-doux">{movieMeta(movie)}</p>
        {movie.providers.length > 0 && <p className="text-prune-doux">Sur {movie.providers.slice(0, 3).map((p) => p.name).join(', ')}</p>}
        {open && <p className="max-h-32 overflow-y-auto pt-1 leading-snug">{movie.overview || 'Pas de résumé en français pour ce film.'}</p>}
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-h-11 self-start font-medium underline underline-offset-4">
          {open ? 'Masquer le résumé' : 'Lire le résumé'}
        </button>
      </div>
    </article>
  )
}
