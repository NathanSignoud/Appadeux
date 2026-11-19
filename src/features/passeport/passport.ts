// Logique du passeport ciné, pure et testée (tests/passeport.test.ts).
// Source : les films VUS ensemble (matches.done_at), avec leur instantané Movie (pays, année, langue, durée, saga).

type MovieLike = { countries: string[]; year: number | null; language: string; runtime: number | null; collectionId: number | null }

// Codes ISO 3166-1 par continent (TMDB garde aussi quelques pays disparus : SU, XC, YU, XG, CS)
const CONTINENT_CODES: Record<string, string> = {
  Europe: 'AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK SU XC YU XG CS',
  Asie: 'AE AF AM AZ BD BH BN BT CN GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
  Afrique: 'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TG TN TZ UG YT ZA ZM ZW',
  'Amérique du Nord': 'AG AI AW BB BL BM BQ BS BZ CA CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PM PR SV SX TC TT US VC VG VI',
  'Amérique du Sud': 'AR BO BR CL CO EC FK GF GY PE PY SR UY VE',
  Océanie: 'AS AU CK FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV VU WF WS',
}
export const CONTINENTS = Object.keys(CONTINENT_CODES)
const continentOf = new Map(Object.entries(CONTINENT_CODES).flatMap(([name, codes]) => codes.split(' ').map((c) => [c, name] as const)))

/** Pays disparus → pays actuel, pour colorier la carte. */
export const MAP_ALIASES: Record<string, string> = { SU: 'RU', XC: 'CZ', YU: 'RS', CS: 'RS', XG: 'DE' }

export const DECADES = [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]
export const decadeOf = (year: number) => year - (year % 10)

export type Stats = ReturnType<typeof passportStats>

export function passportStats(movies: MovieLike[]) {
  const countries = new Map<string, number>()
  const decades = new Map<number, number>()
  const continents = new Set<string>()
  const collections = new Map<number, number>()
  let nonEnglish = 0
  let longest = 0
  let oldest = Infinity
  for (const m of movies) {
    for (const c of m.countries) {
      countries.set(c, (countries.get(c) ?? 0) + 1)
      const continent = continentOf.get(c)
      if (continent) continents.add(continent)
    }
    if (m.year) {
      decades.set(decadeOf(m.year), (decades.get(decadeOf(m.year)) ?? 0) + 1)
      oldest = Math.min(oldest, m.year)
    }
    if (m.language && m.language !== 'en') nonEnglish++
    longest = Math.max(longest, m.runtime ?? 0)
    if (m.collectionId) collections.set(m.collectionId, (collections.get(m.collectionId) ?? 0) + 1)
  }
  return { count: movies.length, countries, decades, continents, nonEnglish, longest, oldest, maxSaga: Math.max(0, ...collections.values()) }
}

/** Badge = un objectif chiffré. Pour en ajouter un : une ligne ici, rien d'autre. */
export type Badge = { id: string; title: string; description: string; goal: number; value: (s: Stats) => number }

export const BADGES: Badge[] = [
  { id: 'premier', title: 'Première séance', description: 'Un premier film vu ensemble', goal: 1, value: (s) => s.count },
  { id: 'habitues', title: 'Habitués', description: '10 films vus ensemble', goal: 10, value: (s) => s.count },
  { id: 'premier-rang', title: 'Premier rang', description: '50 films vus ensemble', goal: 50, value: (s) => s.count },
  { id: 'globe', title: 'Globe-trotters', description: 'Des films de 10 pays', goal: 10, value: (s) => s.countries.size },
  { id: 'continents', title: 'Tour du monde', description: 'Un film par continent', goal: CONTINENTS.length, value: (s) => s.continents.size },
  { id: 'decennies', title: 'Voyage dans le temps', description: '5 décennies différentes', goal: 5, value: (s) => s.decades.size },
  { id: 'trilogie', title: 'Trilogie complète', description: 'Trois films d’une même saga', goal: 3, value: (s) => s.maxSaga },
  { id: 'vo', title: 'Sous-titres', description: '10 films non anglophones', goal: 10, value: (s) => s.nonEnglish },
  { id: 'fleuve', title: 'Film fleuve', description: 'Un film de plus de 3 h', goal: 1, value: (s) => (s.longest >= 180 ? 1 : 0) },
  { id: 'age-or', title: 'Âge d’or', description: 'Un film d’avant 1960', goal: 1, value: (s) => (s.oldest < 1960 ? 1 : 0) },
  { id: 'muet', title: 'Cinéma muet', description: 'Un film d’avant 1930', goal: 1, value: (s) => (s.oldest < 1930 ? 1 : 0) },
]

export const badgeProgress = (b: Badge, s: Stats) => Math.min(b.goal, b.value(s))

// Suggestions « pour compléter votre passeport » : des cinémas et des décennies riches en films bien notés
export const SUGGESTED_COUNTRIES = ['KR', 'JP', 'IT', 'ES', 'IN', 'MX', 'BR', 'IR', 'DK', 'SE', 'DE', 'CN', 'HK', 'AR', 'TW', 'BE', 'PL', 'NO', 'TR', 'SN', 'CL']
export const SUGGESTED_DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010]

export type Suggestion = { country: string; decade?: never } | { decade: number; country?: never }

/** Pays et décennies qui manquent, en alternance. */
export function suggestions(s: Stats): Suggestion[] {
  const countries = SUGGESTED_COUNTRIES.filter((c) => !s.countries.has(c)).map((country) => ({ country }))
  const decades = SUGGESTED_DECADES.filter((d) => !s.decades.has(d)).map((decade) => ({ decade }))
  const out: Suggestion[] = []
  for (let i = 0; i < Math.max(countries.length, decades.length); i++) {
    if (countries[i]) out.push(countries[i])
    if (decades[i]) out.push(decades[i])
  }
  return out
}
