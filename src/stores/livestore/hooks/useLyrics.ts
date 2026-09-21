import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { NO_MATCH_ID } from '../query'

/**
 * Get lyrics for a specific media track
 * 
 * @param mediaId - Media track ID
 * @returns Lyrics data or undefined if not found
 */
export const useLyrics = (mediaId: string | undefined) => {
  const store = useAppStore()
  return store.useQuery(
    mediaId
      ? queryDb(
          tables.lyrics.select().where('mediaId', '=', mediaId).limit(1)
        )
      : queryDb(tables.lyrics.select().where('id', '=', NO_MATCH_ID).limit(1))
  )
}

/**
 * Get all lyrics entries
 * 
 * @returns Array of all lyrics entries
 */
export const useAllLyrics = () => {
  const store = useAppStore()
  return store.useQuery(queryDb(tables.lyrics.select()))
}
