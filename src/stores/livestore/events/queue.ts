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
      randomTrackIds: Schema.optional(Schema.Array(Schema.String)),
      currentPlaying: Schema.optional(Schema.Number),
      shuffle: Schema.Boolean,
      repeat: Schema.Boolean,
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
   * Fired when shuffle mode is toggled.
   *
   * Touches the head row only: `randomOrder` is a permutation of ordered-list
   * indices, so a 60k-track queue toggles in one row write instead of
   * rewriting every track row.
   */
  queueShuffleToggled: Events.synced({
    name: 'v1.QueueShuffleToggled',
    schema: Schema.Struct({
      queueId: Schema.String,
      shuffle: Schema.Boolean,
      currentPlaying: Schema.optional(Schema.Number),
      randomOrder: Schema.optional(Schema.Array(Schema.Number)),
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
      trackId: Schema.optional(Schema.String),
    }),
  }),
}
