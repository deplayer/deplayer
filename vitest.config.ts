import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [],
  test: {
    coverage: {
      provider: 'v8'
    },
    environment: 'happy-dom',
    deps: {
      inline: [
        '@happy-js/happy-opfs'
      ]
    }
  },
});
