import { defineConfig, type UserConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

type VitePlugins = NonNullable<UserConfig['plugins']>

export default defineConfig({
  // @vitejs/plugin-react resolves a different `vite` copy than vitest bundles, so the Plugin types don't line up
  plugins: [react() as unknown as VitePlugins[number]],
  resolve: {
    alias: {
      'virtual:pwa-register/react': new URL('./src/test-utils/pwa-mock.ts', import.meta.url).pathname,
      'node-datachannel': fileURLToPath(new URL('./scripts/node-datachannel-stub/index.js', import.meta.url)),
      'webtorrent': fileURLToPath(new URL('./node_modules/webtorrent/dist/webtorrent.min.js', import.meta.url)),
      'react': fileURLToPath(new URL('./node_modules/react', import.meta.url)),
      'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    exclude: ['e2e/**', 'sync-worker/**', '**/node_modules/**', 'server/**'],
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
