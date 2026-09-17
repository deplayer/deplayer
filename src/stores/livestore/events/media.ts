import { Events, Schema } from '@livestore/livestore'

/**
 * Media Domain Events
 *
 * These events represent all operations on media tracks in the library.
 * Artist and Album are embedded as they'll be normalized during materialization.
 */

/**
 * One item of a sync batch. Shared by mediaBulkAdded and mediaBulkUpdated so
 * the two events can never drift apart in shape.
 *
 * Note: media ids are content-derived (title/artist/album/track — no provider
 * passes forcedId), so for a stable id the title/artist/album fields are
 * always identical to what is already stored; bulk updates exist for the
 * fields the id does not cover (duration, discNumber, type, genres, stream
 * membership, externalId, shareUrl, filePath).
 */
const mediaSyncItemSchema = Schema.Struct({
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
      media: Schema.Array(mediaSyncItemSchema),
    }),
  }),

  /**
   * Bulk metadata update for media that already exists. Emitted by the sync
   * committer when a stable-id row differs in the fields the id does not
   * cover. Media that does not exist yet goes through mediaBulkAdded.
   */
  mediaBulkUpdated: Events.synced({
    name: 'v1.MediaBulkUpdated',
    schema: Schema.Struct({
      media: Schema.Array(mediaSyncItemSchema),
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
