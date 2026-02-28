import { Events, Schema } from '@livestore/livestore'

/**
 * Playback Domain Events (CLIENT ONLY - not synced across devices)
 * 
 * These events control the playback state on this device only.
 * Using clientOnly() ensures they don't sync to other devices.
 */
export const playbackEvents = {
  /**
   * Fired when playback state is updated (currentTrack, playing, etc.)
   */
  playbackUpdated: Events.clientOnly({
    name: 'v1.PlaybackUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      currentTrackId: Schema.optional(Schema.String),
      streamUri: Schema.optional(Schema.String),
      playing: Schema.Boolean,
      volume: Schema.Number,
      duration: Schema.optional(Schema.Number),
      position: Schema.optional(Schema.Number),
    }),
  }),

  /**
   * Fired when play/pause state changes
   */
  playbackPlayingChanged: Events.clientOnly({
    name: 'v1.PlaybackPlayingChanged',
    schema: Schema.Struct({
      id: Schema.String,
      playing: Schema.Boolean,
    }),
  }),

  /**
   * Fired when volume changes
   */
  playbackVolumeChanged: Events.clientOnly({
    name: 'v1.PlaybackVolumeChanged',
    schema: Schema.Struct({
      id: Schema.String,
      volume: Schema.Number,
    }),
  }),

  /**
   * Fired when position changes (seek or progress update)
   */
  playbackPositionChanged: Events.clientOnly({
    name: 'v1.PlaybackPositionChanged',
    schema: Schema.Struct({
      id: Schema.String,
      position: Schema.Number,
    }),
  }),

  /**
   * Fired when a new track starts loading
   */
  playbackTrackChanged: Events.clientOnly({
    name: 'v1.PlaybackTrackChanged',
    schema: Schema.Struct({
      id: Schema.String,
      currentTrackId: Schema.String,
      streamUri: Schema.String,
      duration: Schema.optional(Schema.Number),
    }),
  }),

  /**
   * Fired when playback is stopped/cleared
   */
  playbackCleared: Events.clientOnly({
    name: 'v1.PlaybackCleared',
    schema: Schema.Struct({
      id: Schema.String,
    }),
  }),
}
