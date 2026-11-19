// Thème clair / sombre. Le script de index.html applique le choix avant le premier affichage ; ici on le change.
export type ThemePref = 'auto' | 'light' | 'dark'
const KEY = 'nous.theme'

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    // navigation privée : le choix vaut pour cette visite seulement
  }
  const dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector<HTMLMetaElement>('meta[name=theme-color]')!.content = dark ? '#1C1529' : '#EFEAFB'
}
