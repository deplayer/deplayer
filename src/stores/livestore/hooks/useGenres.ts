import { useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'

/**
 * Returns a map of genre -> song IDs
 * Matches the Redux collection.songsByGenre structure
 */
export const useSongsByGenre = (): Record<string, string[]> => {
  const media = useQuery(
    queryDb(
      tables.media.select()
    )
  )

  return useMemo(() => {
    const songsByGenre: Record<string, string[]> = {}

    if (!Array.isArray(media)) return songsByGenre

    for (const track of media) {
      if (!track.genres) continue
      
      // Parse genres if it's stored as JSON string
      const genres = typeof track.genres === 'string' 
        ? JSON.parse(track.genres) 
        : track.genres

      if (!Array.isArray(genres)) continue

      for (const genre of genres) {
        if (!songsByGenre[genre]) {
          songsByGenre[genre] = []
        }
        songsByGenre[genre].push(track.id)
      }
    }

    return songsByGenre
  }, [media])
}

/**
 * Returns an array of all unique genres with their counts
 * Sorted by count descending
 */
export const useGenres = (): Array<{ name: string; count: number }> => {
  const songsByGenre = useSongsByGenre()

  return useMemo(() => {
    return Object.entries(songsByGenre)
      .map(([name, songs]) => ({
        name,
        count: songs.length
      }))
      .sort((a, b) => b.count - a.count)
  }, [songsByGenre])
}
