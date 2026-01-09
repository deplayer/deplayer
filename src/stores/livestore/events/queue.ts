import { Events, Schema } from '@livestore/livestore'

/**
 * Queue Domain Events
 * 
 * These events represent operations on the playback queue
 */

export const queueEvents = {
  /**
   * Fired when the entire queue is updated
   */
  queueUpdated: Events.synced({
    name: 'v1.QueueUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      trackIds: Schema.Array(Schema.String),
      currentPlaying: Schema.optional(Schema.Number),
      shuffle: Schema.Boolean,
      repeat: Schema.Boolean,
    }),
  }),

  /**
   * Fired when a track is added to the queue
   */
  queueTrackAdded: Events.synced({
    name: 'v1.QueueTrackAdded',
    schema: Schema.Struct({
      queueId: Schema.String,
      trackId: Schema.String,
      position: Schema.optional(Schema.Number),
    }),
  }),

  /**
   * Fired when a track is removed from the queue
   */
  queueTrackRemoved: Events.synced({
    name: 'v1.QueueTrackRemoved',
    schema: Schema.Struct({
      queueId: Schema.String,
      trackId: Schema.String,
    }),
  }),

  /**
   * Fired when the queue is cleared
   */
  queueCleared: Events.synced({
    name: 'v1.QueueCleared',
    schema: Schema.Struct({
      queueId: Schema.String,
    }),
  }),

  /**
   * Fired when shuffle mode is toggled
   */
  queueShuffleToggled: Events.synced({
    name: 'v1.QueueShuffleToggled',
    schema: Schema.Struct({
      queueId: Schema.String,
      shuffle: Schema.Boolean,
    }),
  }),

  /**
   * Fired when repeat mode is toggled
   */
  queueRepeatToggled: Events.synced({
    name: 'v1.QueueRepeatToggled',
    schema: Schema.Struct({
      queueId: Schema.String,
      repeat: Schema.Boolean,
    }),
  }),

  /**
   * Fired when the currently playing position changes
   */
  queuePositionChanged: Events.synced({
    name: 'v1.QueuePositionChanged',
    schema: Schema.Struct({
      queueId: Schema.String,
      position: Schema.Number,
    }),
  }),
}
