import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [react() as any],
  resolve: {
    alias: {
      'virtual:pwa-register/react': new URL('./src/test-utils/pwa-mock.ts', import.meta.url).pathname,
      'node-datachannel': fileURLToPath(new URL('./scripts/node-datachannel-stub/index.js', import.meta.url)),
      'webtorrent': fileURLToPath(new URL('./node_modules/webtorrent/dist/webtorrent.min.js', import.meta.url)),
    },
  },
  test: {
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.ts'],
    deps: {
      inline: [
        '@happy-js/happy-opfs'
      ]
    },
    coverage: {
      provider: 'v8'
    }
  },
});
