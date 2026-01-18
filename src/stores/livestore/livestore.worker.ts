import { makeWorker } from '@livestore/adapter-web/worker'
import { schema } from './schema.js'

/**
 * LiveStore Worker Configuration
 * 
 * Multi-Device Sync:
 * Sync is currently disabled for optimal performance. When ready to enable:
 * 
 * 1. Deploy sync backend (Cloudflare Workers recommended):
 *    - Use the official LiveStore CF Workers template
 *    - Or self-host using the open-source implementation
 *    - See: https://livestore.dev/docs/sync/cloudflare-workers
 * 
 * 2. Configure sync URL in .env:
 *    VITE_LIVESTORE_SYNC_URL=https://your-sync-worker.workers.dev
 * 
 * 3. Install sync package and uncomment below:
 *    npm install @livestore/sync-cf
 * 
 * 4. Uncomment the sync backend configuration
 */

// For multi-device sync via Cloudflare Workers, uncomment:
// import { makeCfSync } from '@livestore/sync-cf'

makeWorker({
  schema,
  
  // Sync configuration
  sync: {
    // Uncomment to enable multi-device sync:
    // backend: makeCfSync({ url: import.meta.env.VITE_LIVESTORE_SYNC_URL }),
    
    /**
     * Initial sync behavior on app boot:
     * - Skip: Don't wait for sync (instant app start, offline-first)
     * - Blocking: Wait for sync to complete (ensures data consistency, slower start)
     * 
     * Recommended: 'Skip' for best performance
     */
    initialSyncOptions: { _tag: 'Skip' },
    
    /**
     * Error handling during sync:
     * - 'ignore': Log error, continue as if offline (graceful degradation)
     * - 'shutdown': Stop app on sync error (strict data consistency)
     * 
     * Recommended: 'ignore' for better user experience
     */
    onSyncError: 'ignore',
  },
})

// Log sync status for debugging
if (import.meta.env.DEV) {
  const syncEnabled = false // Change to true when backend is configured
  console.log(
    `[LiveStore Worker] Sync ${syncEnabled ? 'enabled' : 'disabled'} - ${
      syncEnabled 
        ? 'Multi-device sync active' 
        : 'Running in offline-first mode for optimal performance'
    }`
  )
}

