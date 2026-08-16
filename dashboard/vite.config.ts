import { fileURLToPath, URL } from 'node:url'
// Importing defineConfig from 'vitest/config' (which re-exports Vite's own)
// instead of 'vite' merges in the `test` option's types, so this one file
// stays the single source of truth instead of needing a second config file.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // No runtimeCaching rules -- only the built app shell (JS/CSS/fonts/
      // icons) is precached. Every Supabase call stays live, uncached, so
      // members never see stale financial/vote/member data; the payoff is
      // just an installable icon and an instant-loading shell offline
      // (data fetches on that shell still show the existing error states).
      manifest: {
        name: 'KCA Ajira Club — Member Dashboard',
        short_name: 'Ajira Dashboard',
        description: 'Member and admin dashboard for the KCA Ajira Club.',
        theme_color: '#0b1120',
        background_color: '#0b1120',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
