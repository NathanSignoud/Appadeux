// Page provisoire pour les sections pas encore construites ; disparaît au fil des phases.
export function Soon({ title, phase }: { title: string; phase: number }) {
  return (
    <>
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="blob grid h-56 place-items-center bg-white px-10 text-center">
        <p className="text-lg text-prune-doux">Cette page arrive en phase {phase}.</p>
      </div>
    </>
  )
}
