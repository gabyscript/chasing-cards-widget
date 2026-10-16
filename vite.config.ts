import { fileURLToPath, URL } from 'node:url'
import netlify from '@netlify/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), netlify()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'netlify/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx}', 'netlify/**/*.{ts,mts}'],
      exclude: ['**/*.test.{ts,tsx}', 'netlify/tests/**', 'src/test/**', 'src/main.tsx'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
})
