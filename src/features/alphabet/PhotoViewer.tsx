import { useEffect, useRef } from 'react'

/** Photo en plein écran, avec suppression. */
export function PhotoViewer({ url, onClose, onDelete }: { url?: string; onClose: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-label="Photo"
      className="m-0 h-dvh max-h-none w-full max-w-none bg-black/90 p-0 backdrop:bg-transparent"
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        {url && <img src={url} alt="" className="max-h-[78dvh] max-w-full rounded-2xl object-contain" />}
        <div className="flex gap-3">
          <button type="button" onClick={onDelete} className="min-h-12 rounded-full bg-[#fff]/15 px-6 text-lg font-semibold text-[#fff] active:scale-95">
            Supprimer
          </button>
          <button type="button" onClick={() => ref.current?.close()} className="min-h-12 rounded-full bg-[#fff] px-6 text-lg font-semibold text-[#3b2a55] active:scale-95">
            Fermer
          </button>
        </div>
      </div>
    </dialog>
  )
}
