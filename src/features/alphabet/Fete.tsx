import { useEffect, useRef } from 'react'
import { Button, Overprint } from '../../components/ui'
import { LETTERS } from './hooks'

/** Le petit écran de fête : la 26e lettre vient d'être faite. */
export function Fete({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label="Alphabet terminé"
      className="m-0 h-dvh max-h-none w-full max-w-none bg-lilas/95 p-0 text-prune backdrop:bg-transparent"
    >
      <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
        <Overprint className="h-44 w-72 animate-[pop_420ms_ease-out]">
          <p className="text-6xl font-bold">A → Z</p>
        </Overprint>
        <p aria-hidden="true" className="flex flex-wrap justify-center gap-1.5">
          {LETTERS.map((l, i) => (
            <span
              key={l}
              className={`grid size-9 place-items-center rounded-full font-bold text-white motion-safe:animate-[pop_420ms_ease-out_both] ${i % 2 ? 'bg-encre-b' : 'bg-encre-a'}`}
              style={{ animationDelay: `${300 + i * 40}ms` }}
            >
              {l}
            </span>
          ))}
        </p>
        <p className="text-2xl font-semibold">Alphabet terminé !</p>
        <p className="text-lg text-prune-doux">26 dates, de A à Z. Il ne reste plus qu’à recommencer… ou à inventer un alphabet en verlan.</p>
        <Button onClick={() => ref.current?.close()} className="w-full">
          Bravo à nous
        </Button>
      </div>
    </dialog>
  )
}
