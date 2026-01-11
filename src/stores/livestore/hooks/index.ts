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
  useFilteredMedia,
} from './useMedia'

// Album hooks
export {
  useAlbums,
  useAlbumsMap,
  useAlbumById,
  useAlbumsByArtist,
  useSongsByAlbum,
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
} from './useGenres'
