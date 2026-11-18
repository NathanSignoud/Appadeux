import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Chip, Field, Message } from '../../components/ui'
import { dayKey, timeKey } from '../../lib/dates'
import { frenchError, supabase } from '../../lib/supabase'
import { KIND_LABELS, type CalEvent, type EventKind } from './hooks'

/** null = fermé ; { event } = modifier ; { day } = créer ce jour-là */
export type EventSheetState = { event?: CalEvent; day?: Date } | null

export function EventSheet({ state, onClose }: { state: EventSheetState; onClose: () => void }) {
  return (
    <Sheet open={state !== null} onClose={onClose} title={state?.event ? 'Modifier' : 'Nouvel événement'}>
      {state && <Form event={state.event} day={state.day ?? new Date()} onClose={onClose} />}
    </Sheet>
  )
}

function Form({ event, day, onClose }: { event?: CalEvent; day: Date; onClose: () => void }) {
  const start = event ? new Date(event.starts_at) : day
  const end = event ? new Date(event.ends_at) : day
  const [title, setTitle] = useState(event?.title ?? '')
  const [kind, setKind] = useState<EventKind>((event?.kind as EventKind) ?? 'together')
  const [allDay, setAllDay] = useState(event?.all_day ?? false)
  const [startDate, setStartDate] = useState(dayKey(start))
  const [endDate, setEndDate] = useState(dayKey(end))
  const [startTime, setStartTime] = useState(event && !event.all_day ? timeKey(start) : '19:00')
  const [endTime, setEndTime] = useState(event && !event.all_day ? timeKey(end) : '21:00')
  const [location, setLocation] = useState(event?.location ?? '')
  const [note, setNote] = useState(event?.note ?? '')
  const [pinned, setPinned] = useState(event?.pinned ?? false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllDay = kind === 'absence' || allDay // une absence se compte en journées

  async function save(e: FormEvent) {
    e.preventDefault()
    // Dates locales : « 2026-11-24T19:00 » sans fuseau = heure du téléphone
    const startsAt = new Date(`${startDate}T${isAllDay ? '00:00' : startTime}`)
    const endsAt = new Date(`${endDate}T${isAllDay ? '00:00' : endTime}`)
    if (endsAt < startsAt) return setError('La fin doit être après le début.')
    setBusy(true)
    setError(null)
    const fields = {
      title: title.trim(),
      kind,
      all_day: isAllDay,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      location: kind === 'absence' ? null : location.trim() || null,
      note: note.trim() || null,
      pinned,
    }
    const { error } = event ? await supabase.from('events').update(fields).eq('id', event.id) : await supabase.from('events').insert(fields)
    setBusy(false)
    if (error) setError(frenchError(error))
    else onClose()
  }

  async function remove() {
    if (!event || !confirm(`Supprimer « ${event.title} » ?`)) return
    const { error } = await supabase.from('events').delete().eq('id', event.id)
    if (error) setError(frenchError(error))
    else onClose()
  }

  return (
    <form onSubmit={save} className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto pb-1">
      <Field label="Quoi ?" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'absence' ? 'Week-end entre potes' : 'Ciné, dîner, Rome…'} />

      <fieldset>
        <legend className="mb-2 px-1 font-medium text-prune-doux">Type</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(KIND_LABELS) as EventKind[]).map((k) => (
            <Chip key={k} pressed={kind === k} onClick={() => setKind(k)} className="[&:not([aria-pressed=true])]:bg-white">
              {KIND_LABELS[k]}
            </Chip>
          ))}
        </div>
        {kind === 'absence' && <p className="mt-2 px-1 text-prune-doux">Une absence s’affiche en bandeau dans le calendrier et sur l’accueil.</p>}
      </fieldset>

      {kind !== 'absence' && (
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white px-4 font-medium">
          Toute la journée
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="size-6 accent-prune" />
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={isAllDay ? 'Du' : 'Le'}
          type="date"
          required
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value)
            if (e.target.value > endDate) setEndDate(e.target.value)
          }}
        />
        {!isAllDay && <Field label="À" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />}
        <Field label={isAllDay ? 'Au (inclus)' : 'Jusqu’au'} type="date" required min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        {!isAllDay && <Field label="À" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />}
      </div>

      {kind !== 'absence' && <Field label="Où ? (facultatif)" maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="event-note" className="px-1 font-medium text-prune-doux">
          Note (facultatif)
        </label>
        <textarea
          id="event-note"
          rows={2}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-2xl bg-white p-4 text-lg outline-none focus-visible:ring-3 focus-visible:ring-violet"
        />
      </div>

      <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white px-4 font-medium">
        Compte à rebours sur l’accueil
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="size-6 accent-prune" />
      </label>

      {error && <Message kind="error">{error}</Message>}
      <Button type="submit" disabled={busy}>
        {event ? 'Enregistrer' : 'Ajouter au calendrier'}
      </Button>
      {event && (
        <Button type="button" variant="soft" onClick={remove}>
          Supprimer
        </Button>
      )}
    </form>
  )
}
