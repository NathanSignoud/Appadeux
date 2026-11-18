import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Fond lilas (au lieu du blanc par défaut) pour les icônes Android « maskable » et l'icône iOS
const background = '#EFEAFB'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    maskable: { ...preset.maskable, resizeOptions: { background } },
    apple: { ...preset.apple, resizeOptions: { background } },
  },
  images: ['public/logo.svg'],
})
