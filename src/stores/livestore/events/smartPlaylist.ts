import { Events, Schema } from '@livestore/livestore'

/**
 * Smart Playlist Domain Events
 * 
 * Smart playlists are filter-based playlists that dynamically
 * generate track lists based on genres, types, artists, and providers
 */

export const smartPlaylistEvents = {
  /**
   * Fired when a new smart playlist is created
   */
  smartPlaylistCreated: Events.synced({
    name: 'v1.SmartPlaylistCreated',
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      filters: Schema.Struct({
        genres: Schema.Array(Schema.String),
        types: Schema.Array(Schema.String),
        artists: Schema.Array(Schema.String),
        providers: Schema.Array(Schema.String),
      }),
    }),
  }),

  /**
   * Fired when a smart playlist is deleted
   */
  smartPlaylistDeleted: Events.synced({
    name: 'v1.SmartPlaylistDeleted',
    schema: Schema.Struct({
      smartPlaylistId: Schema.String,
    }),
  }),
}
