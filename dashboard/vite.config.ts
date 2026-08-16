import { fileURLToPath, URL } from 'node:url'
// Importing defineConfig from 'vitest/config' (which re-exports Vite's own)
// instead of 'vite' merges in the `test` option's types, so this one file
// stays the single source of truth instead of needing a second config file.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
