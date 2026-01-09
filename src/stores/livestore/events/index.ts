/**
 * Event Definitions Index
 * 
 * This file exports all domain events for the LiveStore migration.
 * Events are organized by domain for better maintainability.
 */

export { mediaEvents } from './media'
export { playlistEvents } from './playlist'
export { queueEvents } from './queue'
export { favoriteEvents } from './favorites'
export { lyricsEvents } from './lyrics'
export { settingsEvents } from './settings'

// Re-export all events as a single object for convenience
import { mediaEvents } from './media'
import { playlistEvents } from './playlist'
import { queueEvents } from './queue'
import { favoriteEvents } from './favorites'
import { lyricsEvents } from './lyrics'
import { settingsEvents } from './settings'

export const allEvents = {
  ...mediaEvents,
  ...playlistEvents,
  ...queueEvents,
  ...favoriteEvents,
  ...lyricsEvents,
  ...settingsEvents,
}
