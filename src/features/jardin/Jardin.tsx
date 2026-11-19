import { SOURCES, thirstText } from './garden'
import { Plant } from './Plant'
import { useGarden } from './useGarden'

export function Jardin() {
  const { counts, state } = useGarden()
  return (
    <>
      <h1 className="text-3xl font-bold">Notre jardin</h1>

      <section className="flex flex-col items-center gap-2 rounded-[32px] bg-white px-5 pt-4 pb-6 text-center">
        <Plant state={state} className="h-72 w-full" />
        <p className="text-2xl font-bold">{state.label}</p>
        <p className="text-prune-doux">
          {state.points} point{state.points > 1 ? 's' : ''}
          {state.toNext !== null && `, encore ${state.toNext} avant l’étape suivante`}
          {state.toNext === null && state.flowers < 7 && ', chaque tranche de 10 points ajoute une fleur'}
        </p>
        {state.thirst > 0 && <p className="rounded-2xl bg-lilas px-4 py-2 font-medium">{thirstText[state.thirst]}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-xl font-bold">Ce qui la fait pousser</h2>
        <ul className="flex flex-col gap-2">
          {SOURCES.map((s) => (
            <li key={s.id} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white px-4">
              <span className="font-medium">
                {s.label} <span className="text-prune-doux">+{s.points}</span>
              </span>
              <span className="text-lg font-bold">{counts[s.id]}</span>
            </li>
          ))}
        </ul>
        <p className="px-1 text-prune-doux">Une semaine sans rien partager et elle commence à pencher. Elle se redresse dès le prochain moment ensemble.</p>
      </section>
    </>
  )
}
