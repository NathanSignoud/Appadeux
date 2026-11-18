import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Génère les icônes (Android, iOS, favicon) depuis le logo et les ajoute au manifest et au <head>
      pwaAssets: { config: true, overrideManifestIcons: true }, // réglages dans pwa-assets.config.ts
      manifest: {
        name: 'Nous',
        short_name: 'Nous',
        description: 'Notre app à deux : ciné, calendrier, listes, dépenses et alphabet des dates.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EFEAFB',
        theme_color: '#EFEAFB',
      },
      workbox: {
        navigateFallback: '/index.html',
      },
    }),
  ],
})
