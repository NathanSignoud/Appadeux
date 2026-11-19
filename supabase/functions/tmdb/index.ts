// Proxy TMDB : le jeton reste côté serveur. Seuls les utilisateurs connectés peuvent appeler,
// et uniquement pour les opérations listées (pas de proxy ouvert vers toute l'API).
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5.9.6'

const TMDB = 'https://api.themoviedb.org/3'
const TOKEN = Deno.env.get('TMDB_READ_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
// Le projet signe les sessions en ES256 : on vérifie avec ses clés publiques (verify_jwt est désactivé dans config.toml)
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

type Params = Record<string, string | number | undefined>

async function tmdb(path: string, params: Params = {}) {
  const url = new URL(TMDB + path)
  url.searchParams.set('language', 'fr-FR')
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`TMDB ${res.status} sur ${path}`)
  return res.json()
}

// Forme renvoyée au front ; c'est aussi l'instantané stocké dans swipes/matches.payload
async function movie(id: number) {
  const m = await tmdb(`/movie/${id}`, { append_to_response: 'watch/providers' })
  const fr = m['watch/providers']?.results?.FR
  return {
    id: m.id,
    title: m.title,
    originalTitle: m.original_title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    runtime: m.runtime || null,
    overview: m.overview ?? '',
    posterPath: m.poster_path,
    genres: (m.genres ?? []).map((g: { id: number }) => g.id),
    countries: (m.production_countries ?? []).map((c: { iso_3166_1: string }) => c.iso_3166_1),
    language: m.original_language,
    collectionId: m.belongs_to_collection?.id ?? null, // pour le badge « trilogie complète » (phase 4)
    voteAverage: m.vote_average,
    providers: (fr?.flatrate ?? []).map((p: { provider_id: number; provider_name: string; logo_path: string }) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path,
    })),
  }
}

// Validation des entrées : entiers bornés, listes courtes
const int = (v: unknown, min: number, max: number) => (Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : undefined)
const ints = (v: unknown) => (Array.isArray(v) ? v.filter((x) => int(x, 1, 1_000_000) !== undefined).slice(0, 30) : [])

async function handle(body: Record<string, unknown>) {
  switch (body.op) {
    case 'discover': {
      const genres = ints(body.genres)
      const providers = ints(body.providers)
      const page = int(body.page, 1, 500) ?? 1
      // Passeport : films d'un pays ou d'une décennie qui nous manque → les mieux notés, avec assez de votes
      const country = typeof body.country === 'string' && /^[A-Z]{2}$/.test(body.country) ? body.country : undefined
      const decade = int(body.decade, 1900, 2030)
      const passport = Boolean(country || decade)
      const list = await tmdb('/discover/movie', {
        page,
        region: 'FR',
        sort_by: passport ? 'vote_average.desc' : 'popularity.desc',
        include_adult: 'false',
        'vote_count.gte': passport ? 300 : 150,
        with_origin_country: country,
        'primary_release_date.gte': decade ? `${decade - (decade % 10)}-01-01` : undefined,
        'primary_release_date.lte': decade ? `${decade - (decade % 10) + 9}-12-31` : undefined,
        with_genres: genres.join('|'), // | = OU
        'with_runtime.lte': int(body.maxRuntime, 30, 400),
        with_watch_providers: providers.join('|'),
        watch_region: providers.length ? 'FR' : undefined,
        with_watch_monetization_types: providers.length ? 'flatrate' : undefined,
      })
      // Détails en parallèle : durée, pays et plateformes ne sont pas dans /discover
      const movies = await Promise.all(list.results.map((r: { id: number }) => movie(r.id)))
      return { movies, totalPages: Math.min(list.total_pages, 500) }
    }
    case 'search': {
      const query = typeof body.query === 'string' ? body.query.trim().slice(0, 100) : ''
      if (!query) return { results: [] }
      const list = await tmdb('/search/movie', { query, region: 'FR', include_adult: 'false' })
      return {
        results: list.results.slice(0, 12).map((r: { id: number; title: string; release_date?: string; poster_path: string | null }) => ({
          id: r.id,
          title: r.title,
          year: r.release_date ? Number(r.release_date.slice(0, 4)) : null,
          posterPath: r.poster_path,
        })),
      }
    }
    case 'movie': {
      const id = int(body.id, 1, 100_000_000)
      if (!id) throw new Error('id invalide')
      return movie(id)
    }
    case 'providers': {
      const list = await tmdb('/watch/providers/movie', { watch_region: 'FR' })
      return {
        providers: list.results
          .sort((a: { display_priorities?: { FR?: number } }, b: { display_priorities?: { FR?: number } }) =>
            (a.display_priorities?.FR ?? 999) - (b.display_priorities?.FR ?? 999),
          )
          .slice(0, 24)
          .map((p: { provider_id: number; provider_name: string; logo_path: string }) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path })),
      }
    }
    default:
      throw new Error('opération inconnue')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  try {
    const { payload } = await jwtVerify(auth.replace(/^Bearer /, ''), JWKS, { audience: 'authenticated' })
    if (payload.role !== 'authenticated') throw new Error('rôle')
  } catch {
    return json({ error: 'unauthorized' }, 401)
  }

  if (!TOKEN) return json({ error: 'TMDB_READ_TOKEN manquant dans les secrets' }, 500)
  try {
    return json(await handle(await req.json()))
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'erreur' }, 502)
  }
})
