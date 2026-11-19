import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' }

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const look = variant === 'primary' ? 'bg-prune text-white' : 'bg-white text-prune'
  return (
    <button
      className={`min-h-12 rounded-full px-6 text-lg font-semibold transition active:scale-[0.97] disabled:opacity-50 ${look} ${className}`}
      {...props}
    />
  )
}

/** Pastille à bascule (filtres, abonnements). */
export function Chip({ pressed, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`min-h-11 rounded-full px-4 font-medium transition active:scale-95 ${pressed ? 'bg-prune text-white' : 'bg-white text-prune'} ${className}`}
      {...props}
    />
  )
}

export function Stars({ value }: { value: number }) {
  return (
    <span role="img" aria-label={`${value} sur 5`} className="text-xl tracking-wider">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'text-violet' : 'text-lilas-fonce'}>
          ★
        </span>
      ))}
    </span>
  )
}

export function Field({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId()
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="px-1 font-medium text-prune-doux">
        {label}
      </label>
      {/* text-lg (≥16 px) : évite le zoom automatique d'iOS sur les champs */}
      <input id={id} className="min-h-12 rounded-2xl bg-white px-4 text-lg outline-none focus-visible:ring-3 focus-visible:ring-violet" {...props} />
    </div>
  )
}

export function Message({ kind, children }: { kind: 'error' | 'info'; children: ReactNode }) {
  return (
    <p role={kind === 'error' ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 ${kind === 'error' ? 'bg-white text-erreur' : 'bg-menthe'}`}>
      {children}
    </p>
  )
}

export function Avatar({ name, ink }: { name: string; ink: 'a' | 'b' }) {
  return (
    <span aria-hidden="true" className={`grid size-9 place-items-center rounded-full font-semibold ${ink === 'a' ? 'bg-encre-a' : 'bg-encre-b'}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

/** La touche riso : deux encres décalées qui se superposent. Réservé à ce qui se vit à deux. */
export function Overprint({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate ${className}`}>
      <div aria-hidden="true" className="blob absolute inset-0 right-4 bottom-3 bg-encre-a mix-blend-multiply dark:mix-blend-screen" />
      <div aria-hidden="true" className="blob-alt absolute inset-0 top-3 left-4 bg-encre-b mix-blend-multiply dark:mix-blend-screen" />
      {/* texte blanc : lisible sur le violet de superposition (contraste 5,6:1) */}
      <div className="relative flex h-full flex-col items-center justify-center text-center text-white">{children}</div>
    </div>
  )
}

/** État vide : deux formes pastel qui se chevauchent, une phrase qui invite à agir, une action éventuelle. */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[32px] bg-white px-8 py-8 text-center">
      <span aria-hidden="true" className="relative isolate h-14 w-20">
        <span className="blob absolute top-0 left-0 size-14 bg-peche mix-blend-multiply dark:mix-blend-screen" />
        <span className="blob-alt absolute right-0 bottom-0 size-11 bg-menthe mix-blend-multiply dark:mix-blend-screen" />
      </span>
      <p className="text-lg text-prune-doux">{children}</p>
      {action}
    </div>
  )
}
