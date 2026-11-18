import { useEffect, useRef } from 'react'
import { Button, Overprint } from '../../components/ui'

/** « Match ! » : le moment riso par excellence, les deux encres se superposent. */
export function MatchOverlay({ title, image, onClose }: { title: string; image: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={`Match : ${title}`}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-lilas/95 p-0 text-prune backdrop:bg-transparent"
    >
      <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
        <Overprint className="h-40 w-64 animate-[pop_420ms_ease-out]">
          <p className="text-6xl font-bold">Match !</p>
        </Overprint>
        {image && <img src={image} alt="" className="h-60 rounded-[28px] object-cover shadow-[0_12px_40px_-16px_rgb(59_42_85/0.5)]" />}
        <p className="text-2xl font-semibold">{title}</p>
        <p className="text-lg text-prune-doux">Vous en avez envie tous les deux. C’est noté dans vos matchs.</p>
        <Button onClick={() => ref.current?.close()} className="w-full">
          Continuer
        </Button>
      </div>
    </dialog>
  )
}
