import { defineConfig, type UserConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

type VitePlugins = NonNullable<UserConfig['plugins']>

// Vite's `?worker` / `?sharedworker` imports (src/stores/livestore/store.ts)
// resolve to Worker constructor wrappers in the app. Vitest 5 evaluates the
// worker module itself instead, which crashes on import; tests never boot the
// web adapter (real-store specs use @livestore/adapter-node), so a constructor
// stub is enough.
const WORKER_STUB_ID = '\0vitest-worker-stub'
const stubWorkerImports: VitePlugins[number] = {
  name: 'stub-worker-imports',
  enforce: 'pre',
  resolveId: (id: string) => (/\?(shared)?worker$/.test(id) ? WORKER_STUB_ID : null),
  load: (id: string) => (id === WORKER_STUB_ID ? 'export default class WorkerStub {}' : null),
}

export default defineConfig({
  // @vitejs/plugin-react resolves a different `vite` copy than vitest bundles, so the Plugin types don't line up
  plugins: [stubWorkerImports, react() as unknown as VitePlugins[number]],
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
    // Real-store specs load @livestore/adapter-node, which pulls in the
    // native @parcel/watcher addon; it cannot load in two worker threads of
    // one process ("Module did not self-register"), so isolate by process.
    pool: 'forks',
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
