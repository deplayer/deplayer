import { Events, Schema } from '@livestore/livestore'

/**
 * Playlist Domain Events
 * 
 * These events represent playlist management operations
 */

export const playlistEvents = {
  /**
   * Fired when a new playlist is created
   */
  playlistCreated: Events.synced({
    name: 'v1.PlaylistCreated',
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
    }),
  }),

  /**
   * Fired when a playlist is renamed
   */
  playlistRenamed: Events.synced({
    name: 'v1.PlaylistRenamed',
    schema: Schema.Struct({
      playlistId: Schema.String,
      name: Schema.String,
    }),
  }),

  /**
   * Fired when a track is added to a playlist
   */
  playlistTrackAdded: Events.synced({
    name: 'v1.PlaylistTrackAdded',
    schema: Schema.Struct({
      playlistId: Schema.String,
      trackId: Schema.String,
      position: Schema.optional(Schema.Number),
    }),
  }),

  /**
   * Fired when a track is removed from a playlist
   */
  playlistTrackRemoved: Events.synced({
    name: 'v1.PlaylistTrackRemoved',
    schema: Schema.Struct({
      playlistId: Schema.String,
      trackId: Schema.String,
    }),
  }),

  /**
   * Fired when playlist tracks are reordered
   */
  playlistReordered: Events.synced({
    name: 'v1.PlaylistReordered',
    schema: Schema.Struct({
      playlistId: Schema.String,
      trackIds: Schema.Array(Schema.String),
    }),
  }),

  /**
   * Fired when a playlist is deleted
   */
  playlistDeleted: Events.synced({
    name: 'v1.PlaylistDeleted',
    schema: Schema.Struct({
      playlistId: Schema.String,
    }),
  }),

  /**
   * Fired when shuffle mode is toggled for a playlist
   */
  playlistShuffleToggled: Events.synced({
    name: 'v1.PlaylistShuffleToggled',
    schema: Schema.Struct({
      playlistId: Schema.String,
      shuffle: Schema.Boolean,
    }),
  }),

  /**
   * Fired when repeat mode is toggled for a playlist
   */
  playlistRepeatToggled: Events.synced({
    name: 'v1.PlaylistRepeatToggled',
    schema: Schema.Struct({
      playlistId: Schema.String,
      repeat: Schema.Boolean,
    }),
  }),
}
