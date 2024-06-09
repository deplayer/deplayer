import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [],
  test: {
    setupFiles: ['vitest-setup.ts'],
    environment: 'happy-dom'
  },
});
