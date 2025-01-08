import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [],
  test: {
    coverage: {
      provider: 'v8'
    },
    setupFiles: ['src/test/setup.ts'],
    environment: 'happy-dom',
    deps: {
      inline: [
        '@happy-js/happy-opfs'
      ]
    }
  },
});
