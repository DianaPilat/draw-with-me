import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts so tests skip the PWA plugin.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
})
