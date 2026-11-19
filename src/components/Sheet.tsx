import { useEffect, useRef, type ReactNode } from 'react'

/** Panneau qui monte du bas. <dialog> natif : focus piégé, Échap pour fermer, fond assombri. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // clic sur le fond (hors du contenu) = fermer
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-[32px] bg-lilas p-0 text-prune backdrop:bg-prune/40 sm:mx-auto sm:max-w-lg"
    >
      <div className="flex flex-col gap-4 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="mx-auto h-1.5 w-12 rounded-full bg-lilas-fonce" />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-11 place-items-center rounded-full bg-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  )
}
