import { events } from '../schema'

/**
 * LiveStore Lyrics Actions
 * 
 * These actions handle lyrics management for media tracks.
 * Lyrics can be fetched from external APIs and stored locally.
 * 
 * All actions require a store parameter from useStore() hook.
 */

type LiveStore = {
  commit: (event: Record<string, unknown>) => void
  query: (query: any) => Promise<any>
  [key: string]: any
}

/**
 * Add lyrics for a media track
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID
 * @param lyricsText - Lyrics text content
 * @param source - Optional source of the lyrics (e.g., 'lyrics.ovh')
 */
export const addLyricsAction = async (
  store: LiveStore,
  mediaId: string,
  lyricsText: string,
  source?: string
) => {
  const id = `lyrics-${mediaId}-${Date.now()}`
  store.commit(
    events.lyricsAdded({
      id,
      mediaId,
      lyricsText,
      source,
    })
  )
}

/**
 * Update lyrics for a media track
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID
 * @param lyricsText - Updated lyrics text content
 */
export const updateLyricsAction = async (
  store: LiveStore,
  mediaId: string,
  lyricsText: string
) => {
  store.commit(
    events.lyricsUpdated({
      mediaId,
      lyricsText,
    })
  )
}

/**
 * Remove lyrics for a media track
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID
 */
export const removeLyricsAction = async (store: LiveStore, mediaId: string) => {
  store.commit(
    events.lyricsRemoved({
      mediaId,
    })
  )
}
