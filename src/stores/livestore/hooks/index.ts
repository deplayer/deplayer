/**
 * LiveStore Query Hooks
 * 
 * This module exports all query hooks for accessing LiveStore data.
 * All hooks are reactive and automatically update when data changes.
 */

// Media hooks
export {
  useMediaLibrary,
  useMediaMap,
  useMediaById,
  useMediaByArtist,
  useMediaByAlbum,
  useSearchMedia,
  useRecentlyPlayed,
  useMostPlayed,
} from './useMedia'

// Album hooks
export {
  useAlbums,
  useAlbumsMap,
  useAlbumById,
  useAlbumsByArtist,
} from './useAlbums'

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
