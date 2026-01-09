import { Events, Schema } from '@livestore/livestore'

/**
 * Lyrics Domain Events
 * 
 * These events represent lyrics management for media tracks
 */

export const lyricsEvents = {
  /**
   * Fired when lyrics are added for a media track
   */
  lyricsAdded: Events.synced({
    name: 'v1.LyricsAdded',
    schema: Schema.Struct({
      id: Schema.String,
      mediaId: Schema.String,
      lyricsText: Schema.String,
      source: Schema.optional(Schema.String), // Where the lyrics came from
    }),
  }),

  /**
   * Fired when lyrics are updated for a media track
   */
  lyricsUpdated: Events.synced({
    name: 'v1.LyricsUpdated',
    schema: Schema.Struct({
      mediaId: Schema.String,
      lyricsText: Schema.String,
    }),
  }),

  /**
   * Fired when lyrics are removed for a media track
   */
  lyricsRemoved: Events.synced({
    name: 'v1.LyricsRemoved',
    schema: Schema.Struct({
      mediaId: Schema.String,
    }),
  }),
}
