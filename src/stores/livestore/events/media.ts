import { Events, Schema } from '@livestore/livestore'

/**
 * Media Domain Events
 * 
 * These events represent all operations on media tracks in the library.
 * Artist and Album are embedded as they'll be normalized during materialization.
 */

export const mediaEvents = {
  /**
   * Fired when a new media track is added to the library
   */
  mediaAdded: Events.synced({
    name: 'v1.MediaAdded',
    schema: Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      // Embedded artist info for denormalization
      artist: Schema.Struct({
        id: Schema.String,
        name: Schema.String,
      }),
      // Embedded album info for denormalization
      album: Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        artistId: Schema.String,
        thumbnailUrl: Schema.optional(Schema.String),
        year: Schema.optional(Schema.Number),
      }),
      type: Schema.String, // 'audio' | 'video'
      duration: Schema.optional(Schema.Number),
      track: Schema.optional(Schema.Number),
      discNumber: Schema.optional(Schema.Number),
      stream: Schema.Unknown, // Complex stream object
      cover: Schema.optional(Schema.Unknown), // Cover URLs
      genres: Schema.Array(Schema.String),
      externalId: Schema.optional(Schema.String),
      shareUrl: Schema.optional(Schema.String),
      filePath: Schema.optional(Schema.String),
    }),
  }),

  /**
   * Fired when media metadata is updated
   */
  mediaUpdated: Events.synced({
    name: 'v1.MediaUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      title: Schema.optional(Schema.String),
      duration: Schema.optional(Schema.Number),
      stream: Schema.optional(Schema.Unknown),
      cover: Schema.optional(Schema.Unknown),
      genres: Schema.optional(Schema.Array(Schema.String)),
    }),
  }),

  /**
   * Fired when a media track is played (increments play count)
   */
  mediaPlayed: Events.synced({
    name: 'v1.MediaPlayed',
    schema: Schema.Struct({
      id: Schema.String,
    }),
  }),

  /**
   * Bulk operation for adding multiple media tracks at once
   * Used for importing large collections
   */
  mediaBulkAdded: Events.synced({
    name: 'v1.MediaBulkAdded',
    schema: Schema.Struct({
      media: Schema.Array(
        Schema.Struct({
          id: Schema.String,
          title: Schema.String,
          artist: Schema.Struct({
            id: Schema.String,
            name: Schema.String,
          }),
          album: Schema.Struct({
            id: Schema.String,
            name: Schema.String,
            artistId: Schema.String,
            thumbnailUrl: Schema.optional(Schema.String),
            year: Schema.optional(Schema.Number),
          }),
          type: Schema.String,
          duration: Schema.optional(Schema.Number),
          track: Schema.optional(Schema.Number),
          discNumber: Schema.optional(Schema.Number),
          stream: Schema.Unknown,
          cover: Schema.optional(Schema.Unknown),
          genres: Schema.Array(Schema.String),
          externalId: Schema.optional(Schema.String),
          shareUrl: Schema.optional(Schema.String),
          filePath: Schema.optional(Schema.String),
        })
      ),
    }),
  }),

  /**
   * Bulk operation for removing multiple media tracks
   */
  mediaBulkRemoved: Events.synced({
    name: 'v1.MediaBulkRemoved',
    schema: Schema.Struct({
      mediaIds: Schema.Array(Schema.String),
    }),
  }),

  /**
   * Fired when a media track is removed from the library
   */
  mediaRemoved: Events.synced({
    name: 'v1.MediaRemoved',
    schema: Schema.Struct({
      id: Schema.String,
    }),
  }),
}
