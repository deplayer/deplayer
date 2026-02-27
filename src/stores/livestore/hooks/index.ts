/**
 * LiveStore Query Hooks
 * 
 * This module exports all query hooks for accessing LiveStore data.
 * All hooks are reactive and automatically update when data changes.
 */

// Collection data hook (optimized single query)
export { useCollectionData } from './useCollectionData'

// Media hooks
export {
  useMediaLibrary,
  useMediaMap,
  useMediaMapForIds,
  useMediaByType,
  useMediaById,
  useMediaByArtist,
  useMediaByAlbum,
  useSearchMedia,
  useSearchMediaIds,
  useRecentlyPlayed,
  useMostPlayed,
  useFilteredMedia,
} from './useMedia'

// Album hooks
export {
  useAlbums,
  useAlbumsMap,
  useAlbumById,
  useAlbumsByArtist,
  useAlbumIdsByArtist,
  useSongsByAlbum,
  useSongsByAlbumForArtist,  // OPTIMIZED: Only fetches artist's songs
  useRecentAlbums,
} from './useAlbums'

// Artist hooks
export {
  useArtists,
  useArtistsMap,
  useArtistById,
  useSongsByArtist,
} from './useArtists'

// Playlist hooks
export {
  usePlaylists,
  usePlaylistById,
  usePlaylistTracks,
} from './usePlaylists'

// Smart Playlist hooks
export {
  useSmartPlaylists,
  useSmartPlaylistById,
} from './useSmartPlaylists'

// Queue hooks
export {
  useQueue,
  useQueueTracks,
  useCurrentTrack,
  useCurrentPlayingSongId,
  useQueueNavigation,
} from './useQueue'

// Favorites hooks
export {
  useFavorites,
  useIsFavorite,
  useFavoriteIds,
} from './useFavorites'

// Lyrics hooks
export {
  useLyrics,
  useAllLyrics,
} from './useLyrics'

// Settings hooks
export {
  useSettings,
  useProviderSettings,
  useAppSettings,
  useLanguageSettings,
  useSyncSettings,
  useEnabledProviders,
} from './useSettings'

// Genre hooks
export {
  useSongsByGenre,
  useGenres,
  useMediaByGenre,
} from './useGenres'

// Metadata hooks (lightweight facet queries for filters)
export {
  useAvailableGenres,
  useAvailableProviders,
  useAvailableTypes,
  useMediaCount,
  useArtistsCount,
  useAlbumsCount,
} from './useMetadata'
