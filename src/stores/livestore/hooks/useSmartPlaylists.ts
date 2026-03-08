import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'

/**
 * LiveStore Hooks for Smart Playlists
 * 
 * Smart playlists are filter-based playlists that dynamically
 * generate track lists based on genres, types, artists, and providers
 */

type SmartPlaylist = {
  id: string
  name: string
  filters: {
    genres: string[]
    types: string[]
    artists: string[]
    providers: string[]
  }
  createdAt: number
}

/**
 * Get all smart playlists
 * @returns Array of smart playlists
 */
export const useSmartPlaylists = (): SmartPlaylist[] => {
  const store = useAppStore()
  return store.useQuery(
    queryDb(
      tables.smartPlaylists
        .select()
        .orderBy('createdAt', 'desc')
    )
  ) as SmartPlaylist[]
}

/**
 * Get a single smart playlist by ID
 * @param smartPlaylistId - Smart playlist ID to fetch
 * @returns Smart playlist or null if not found
 */
export const useSmartPlaylistById = (smartPlaylistId: string | null | undefined): SmartPlaylist | null => {
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      smartPlaylistId
        ? tables.smartPlaylists.select().where('id', '=', smartPlaylistId).limit(1)
        : tables.smartPlaylists.select().where('id', '=', '__NONE__').limit(1)
    )
  )
  return (result as any[])[0] || null
}
