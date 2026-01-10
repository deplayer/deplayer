/**
 * LiveStore Query Hooks
 * 
 * This module exports React hooks for querying LiveStore data.
 * All hooks are reactive and will automatically update when data changes.
 * 
 * Usage:
 * ```tsx
 * import { useMediaLibrary, usePlaylists, useQueue } from '@/stores/livestore/hooks'
 * 
 * const MyComponent = () => {
 *   const media = useMediaLibrary()
 *   const playlists = usePlaylists()
 *   const queue = useQueue()
 *   
 *   return <div>...</div>
 * }
 * ```
 */

// Media hooks
export {
  useMediaLibrary,
  useMediaById,
  useMediaByArtist,
  useMediaByAlbum,
  useSearchMedia,
  useRecentlyPlayed,
  useMostPlayed,
} from './useMedia'

// Playlist hooks
export {
  usePlaylists,
  usePlaylistById,
  usePlaylistTracks,
} from './usePlaylists'

// Queue hooks
export {
  useQueue,
  useQueueTracks,
  useCurrentTrack,
} from './useQueue'

// Favorites hooks
export {
  useFavorites,
  useIsFavorite,
  useFavoriteIds,
} from './useFavorites'

// Settings hooks
export {
  useSettings,
  useProviderSettings,
  useAppSettings,
  useLanguageSettings,
  useSyncSettings,
} from './useSettings'
