import { Events, Schema } from '@livestore/livestore'

export const syncEvents = {
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
}
