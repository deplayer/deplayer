import { Events, Schema } from '@livestore/livestore'

/**
 * Favorites Domain Events
 * 
 * These events represent favoriting/unfavoriting media tracks
 */

export const favoriteEvents = {
  /**
   * Fired when a media track is added to favorites
   */
  mediaFavorited: Events.synced({
    name: 'v1.MediaFavorited',
    schema: Schema.Struct({
      id: Schema.String,
      mediaId: Schema.String,
    }),
  }),

  /**
   * Fired when a media track is removed from favorites
   */
  mediaUnfavorited: Events.synced({
    name: 'v1.MediaUnfavorited',
    schema: Schema.Struct({
      mediaId: Schema.String,
    }),
  }),
}
