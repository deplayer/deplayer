import { Events, Schema } from '@livestore/livestore'

export const syncEvents = {
  /**
   * Legacy single-row sync state. Kept registered so existing eventlogs
   * replay; superseded by v2 (per-provider rows + cursor geometry).
   */
  syncStateUpdated: Events.synced({
    name: 'v1.SyncStateUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      lastSyncTimestamp: Schema.String,
      lastKnownCount: Schema.Number,
      initialSyncCursor: Schema.Number,
      initialSyncComplete: Schema.Boolean,
    }),
  }),
  /**
   * Per-provider sync resume state. `id` is the provider key.
   * `cursorPageSize` records the page size that produced `initialSyncCursor`
   * so a geometry change can invalidate the cursor instead of silently
   * skipping albums. See services/SyncResumeState.ts.
   */
  syncStateUpdatedV2: Events.synced({
    name: 'v2.SyncStateUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      lastSyncTimestamp: Schema.String,
      lastKnownCount: Schema.Number,
      initialSyncCursor: Schema.Number,
      initialSyncComplete: Schema.Boolean,
      cursorPageSize: Schema.Number,
    }),
  }),
}
