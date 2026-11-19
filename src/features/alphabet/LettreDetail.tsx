import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Button, Chip, Field, Message } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { compressImage, useSignedUrls } from '../../lib/photos'
import { frenchError, supabase } from '../../lib/supabase'
import { Fete } from './Fete'
import { BUCKET, LETTERS, organizerOf, STATUS_LABELS, statusOf, useLetters, type LetterRow, type LetterStatus } from './hooks'
import { IDEAS } from './ideas'
import { PhotoViewer } from './PhotoViewer'

export function LettreDetail() {
  const { letter = '' } = useParams()
  const { data, loading, error, reload } = useLetters()
  if (!LETTERS.includes(letter)) return <Navigate to="/alphabet" replace />
  if (loading) return null
  const row = data.find((r) => r.letter === letter)
  const doneElsewhere = data.filter((r) => r.letter !== letter && r.status === 'done').length
  // key : on repart des valeurs enregistrées en changeant de lettre
  return <Detail key={letter} letter={letter} row={row} doneElsewhere={doneElsewhere} loadError={error} reload={reload} />
}

type Props = { letter: string; row?: LetterRow; doneElsewhere: number; loadError: string | null; reload: () => Promise<void> }

function Detail({ letter, row, doneElsewhere, loadError, reload }: Props) {
  const { me, members } = useAuth()
  const [status, setStatus] = useState<LetterStatus>(statusOf(row))
  const [organizer, setOrganizer] = useState(organizerOf(letter, row, members).user_id)
  const [title, setTitle] = useState(row?.title ?? '')
  const [description, setDescription] = useState(row?.description ?? '')
  const [date, setDate] = useState(row?.date_on ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [upload, setUpload] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [party, setParty] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const photos = row?.alphabet_photos ?? []
  const urls = useSignedUrls(BUCKET, photos.map((p) => p.path))
  const label = title.trim() ? `${letter} comme ${title.trim()}` : `Lettre ${letter}`

  /** La ligne n'existe qu'au premier enregistrement ; l'autre a pu la créer en même temps (23505). */
  async function ensureRow(): Promise<string | null> {
    if (row) return row.id
    const { data, error } = await supabase.from('alphabet_letters').insert({ letter, organizer_id: organizer }).select('id').single()
    if (data) return data.id
    if (error?.code === '23505') {
      const { data: existing } = await supabase.from('alphabet_letters').select('id').eq('letter', letter).single()
      if (existing) return existing.id
    }
    setError(error ? frenchError(error) : 'Impossible de créer la lettre.')
    return null
  }

  async function save(e?: FormEvent, opts: { addToAgenda?: boolean } = {}) {
    e?.preventDefault()
    if (opts.addToAgenda && !date) return setError('Choisis d’abord une date.')
    setBusy(true)
    setError(null)
    setSaved(false)
    const id = await ensureRow()
    if (!id) return setBusy(false)

    let eventId = row?.event_id ?? null
    let nextStatus = status
    const day = date ? new Date(`${date}T00:00`).toISOString() : null
    if (opts.addToAgenda && day) {
      const { data, error } = await supabase
        .from('events')
        .insert({ title: label, kind: 'together', all_day: true, starts_at: day, ends_at: day })
        .select('id')
        .single()
      if (error) {
        setBusy(false)
        return setError(frenchError(error))
      }
      eventId = data.id
      if (nextStatus === 'todo') nextStatus = 'planned'
    } else if (eventId && day) {
      // L'événement lié suit la lettre (titre et date) ; s'il a été supprimé de l'agenda, event_id est déjà null
      await supabase.from('events').update({ title: label, starts_at: day, ends_at: day }).eq('id', eventId)
    }

    const { error } = await supabase
      .from('alphabet_letters')
      .update({
        status: nextStatus,
        organizer_id: organizer,
        title: title.trim() || null,
        description: description.trim() || null,
        date_on: date || null,
        event_id: eventId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    setBusy(false)
    if (error) return setError(frenchError(error))
    setStatus(nextStatus)
    setSaved(true)
    if (nextStatus === 'done' && statusOf(row) !== 'done' && doneElsewhere === 25) setParty(true)
    await reload()
  }

  async function addPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    setError(null)
    const id = await ensureRow()
    if (!id || !me) return
    for (const [i, file] of files.entries()) {
      setUpload(`Envoi ${i + 1}/${files.length}…`)
      try {
        const blob = await compressImage(file)
        const path = `${me.couple_id}/${id}/${crypto.randomUUID()}.jpg`
        const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
        if (up.error) throw up.error
        const { error } = await supabase.from('alphabet_photos').insert({ letter_id: id, path })
        if (error) {
          await supabase.storage.from(BUCKET).remove([path]) // pas de fichier orphelin
          throw error
        }
      } catch (err) {
        setError(`Photo ${file.name} non envoyée : ${err instanceof Error ? frenchError(err) : 'erreur'}`)
      }
    }
    setUpload(null)
    await reload()
  }

  async function deletePhoto(path: string) {
    const photo = photos.find((p) => p.path === path)
    if (!photo || !confirm('Supprimer cette photo ?')) return
    setViewing(null)
    const { error } = await supabase.from('alphabet_photos').delete().eq('id', photo.id)
    if (error) return setError(frenchError(error))
    await supabase.storage.from(BUCKET).remove([path])
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link to="/alphabet" className="flex min-h-11 items-center gap-1 self-start font-medium text-prune-doux">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
          Alphabet
        </Link>
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="blob grid size-20 shrink-0 place-items-center bg-violet text-5xl font-bold text-white">
            {letter}
          </span>
          <h1 className="text-3xl leading-tight font-bold break-words">{label}</h1>
        </div>
      </header>

      {(loadError || error) && <Message kind="error">{loadError ?? error}</Message>}

      <form onSubmit={save} className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 px-1 font-medium text-prune-doux">État</legend>
          <div className="flex gap-2">
            {(Object.keys(STATUS_LABELS) as LetterStatus[]).map((s) => (
              <Chip key={s} pressed={status === s} onClick={() => setStatus(s)} className="flex-1">
                {STATUS_LABELS[s]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 px-1 font-medium text-prune-doux">Qui organise ?</legend>
          <div className="flex gap-2">
            {members.map((m) => (
              <Chip key={m.user_id} pressed={organizer === m.user_id} onClick={() => setOrganizer(m.user_id)} className="flex-1">
                {m.user_id === me?.user_id ? 'Moi' : m.display_name}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Field label={`${letter} comme…`} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={IDEAS[letter][0]} />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Idées">
            {IDEAS[letter].map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setTitle(idea)}
                className="min-h-10 rounded-full border-2 border-dashed border-violet/60 px-3 text-sm font-medium text-prune-doux active:scale-95"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        <Field label="Le" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="letter-description" className="px-1 font-medium text-prune-doux">
            Description
          </label>
          <textarea
            id="letter-description"
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Le programme, ou le souvenir qu’on en garde"
            className="rounded-2xl bg-white p-4 text-lg outline-none focus-visible:ring-3 focus-visible:ring-violet"
          />
        </div>

        {saved && <Message kind="info">Enregistré.</Message>}
        <Button type="submit" disabled={busy}>
          Enregistrer
        </Button>
        {row?.event_id ? (
          <Link to="/calendrier/a-venir" className="flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-lg font-semibold">
            Dans l’agenda : voir l’événement
          </Link>
        ) : (
          <Button type="button" variant="soft" disabled={busy} onClick={() => save(undefined, { addToAgenda: true })}>
            Enregistrer et ajouter à l’agenda
          </Button>
        )}
      </form>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold">Photos</h2>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={!!upload}
            className="min-h-11 rounded-full bg-prune px-5 font-semibold text-white active:scale-95 disabled:opacity-60"
          >
            {upload ?? 'Ajouter'}
          </button>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
        </div>
        {photos.length === 0 ? (
          <p className="px-1 text-prune-doux">Pas encore de photo. La première deviendra la couverture de la lettre.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setViewing(p.path)}
                  aria-label={`Voir la photo ${i + 1}${i === 0 ? ' (couverture)' : ''}`}
                  className="block aspect-square w-full overflow-hidden rounded-2xl bg-lilas-fonce"
                >
                  {urls(p.path) && <img src={urls(p.path)} alt="" loading="lazy" className="size-full object-cover" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {viewing && <PhotoViewer url={urls(viewing)} onClose={() => setViewing(null)} onDelete={() => deletePhoto(viewing)} />}
      {party && <Fete onClose={() => setParty(false)} />}
    </>
  )
}
