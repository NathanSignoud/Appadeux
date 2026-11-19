import { useEffect, useRef, useState } from 'react'
import { Button, Overprint } from '../../components/ui'
import { imageUrl, movieMeta, type Movie } from '../../lib/tmdb'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Tirage au sort parmi les films : les affiches défilent, ralentissent, et s'arrêtent sur le film du soir. */
export function Roulette({ movies, onClose }: { movies: Movie[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const [spinning, setSpinning] = useState(true)
  const [round, setRound] = useState(0) // « Relancer » = nouveau tour

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  useEffect(() => {
    const winner = Math.floor(Math.random() * movies.length)
    if (reducedMotion()) {
      setIndex(winner)
      setSpinning(false)
      return
    }
    // ~22 étapes de plus en plus lentes, la dernière tombe sur le gagnant
    const steps = 22
    let step = 0
    let delay = 55
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      step++
      setIndex((winner - (steps - step) + movies.length * steps) % movies.length)
      if (step >= steps) return setSpinning(false)
      delay *= 1.13
      timer = setTimeout(tick, delay)
    }
    setSpinning(true)
    timer = setTimeout(tick, delay)
    return () => clearTimeout(timer)
  }, [movies.length, round])

  const movie = movies[index]
  const poster = imageUrl(movie.posterPath, 'w342')

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label="Roulette"
      className="m-0 h-dvh max-h-none w-full max-w-none bg-lilas/95 p-0 text-prune backdrop:bg-transparent"
    >
      <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center gap-5 px-6 text-center">
        {spinning ? (
          <p className="text-2xl font-bold">Et le film du soir est…</p>
        ) : (
          <Overprint className="h-20 w-56 animate-[pop_420ms_ease-out]">
            <p className="text-3xl font-bold">Ce soir !</p>
          </Overprint>
        )}
        <div className={`h-72 w-48 overflow-hidden rounded-[28px] bg-lilas-fonce shadow-[0_12px_40px_-16px_rgb(59_42_85/0.5)] ${spinning ? '' : 'animate-[pop_420ms_ease-out]'}`}>
          {poster && <img src={poster} alt="" className="size-full object-cover" />}
        </div>
        <div aria-live="polite">
          <p className="text-2xl font-semibold">{movie.title}</p>
          <p className="text-prune-doux">{movieMeta(movie)}</p>
        </div>
        <div className="flex w-full gap-3">
          <Button variant="soft" disabled={spinning} onClick={() => setRound(round + 1)} className="flex-1">
            Relancer
          </Button>
          <Button disabled={spinning} onClick={() => ref.current?.close()} className="flex-1">
            Va pour ça
          </Button>
        </div>
      </div>
    </dialog>
  )
}
