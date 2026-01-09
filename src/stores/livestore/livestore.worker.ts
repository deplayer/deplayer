import { makeWorker } from '@livestore/adapter-web/worker'
import { schema } from './schema.js'

// For now, we'll set up without sync (can add later)
// When ready for sync, uncomment and configure:
// import { makeCfSync } from '@livestore/sync-cf'
// sync: {
//   backend: makeCfSync({ url: import.meta.env.VITE_LIVESTORE_SYNC_URL }),
//   initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
// },

makeWorker({
  schema,
  // Sync will be added later as part of progressive migration
})


