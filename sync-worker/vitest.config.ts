import { defineConfig } from 'vitest/config'

/**
 * Standalone config for the sync-worker unit tests. The root config's
 * `setupFiles` loads React DOM (for app component tests), which pulls in
 * `react-dom` — incompatible with the worker's pure-node tests. Kept
 * separate so `npm test` (app) and `npm run worker:test` (worker) don't
 * share setup.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
})
