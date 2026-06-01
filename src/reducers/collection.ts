import * as types from "../constants/ActionTypes";
import type { MediaRow, ArtistRow, AlbumRow } from "../types/media";
import { applyFilters } from "../utils/apply-filters";
import type { Filter } from "../types/collection";

// Re-export Filter type for backward compatibility
export type { Filter };

/**
 * DEPRECATED: This reducer is being phased out in favor of LiveStore.
 * It now returns a minimal stub state for backward compatibility.
 * DO NOT ADD NEW FEATURES HERE - use LiveStore hooks instead.
 */

export type State = {
  rows: { [key: string]: MediaRow };
  albums: { [key: string]: AlbumRow };
  artists: { [key: string]: ArtistRow };
  songsByArtist: { [key: string]: string[] };
  songsByGenre: { [key: string]: string[] };
  albumsByArtist: { [key: string]: string[] };
  songsByAlbum: { [key: string]: string[] };
  mediaByType: { [key: string]: string[] };
  searchResults: string[];
  enabledProviders: string[];
  loading: boolean;
  totalRows: number;
  activeFilters: Filter;
  filteredSongs: string[];
  recentAlbums: MediaRow[];
};

// Minimal stub state - collection data now lives in LiveStore
export const defaultState: State = {
  rows: {},
  albums: {},
  artists: {},
  songsByArtist: {},
  songsByGenre: {},
  songsByAlbum: {},
  mediaByType: {},
  albumsByArtist: {},
  searchResults: [],
  enabledProviders: [],
  loading: false, // CHANGED: No longer manages loading state
  totalRows: 0,
  activeFilters: {
    genres: [],
    types: [],
    artists: [],
    providers: [],
    favorites: false,
  },
  filteredSongs: [],
  recentAlbums: [],
};

/**
 * DEPRECATED REDUCER - Being migrated to LiveStore
 * 
 * This reducer is maintained for backward compatibility during the migration.
 * New features should use LiveStore hooks instead of Redux collection state.
 * 
 * Current status:
 * - Most functionality migrated to LiveStore
 * - Components use LiveStore hooks (useFilteredMedia, useMediaMapForIds, etc.)
 * - This reducer now primarily handles legacy Redux actions
 */
interface CollectionAction {
  type?: string;
  data?: MediaRow[];
  settings?: { providers: Record<string, { enabled: boolean }> };
  media?: MediaRow;
  filterType?: string;
  values?: string[];
  state?: Set<string>;
  searchResults?: MediaRow[];
  albums?: MediaRow[];
}

export default (state: State = defaultState, action: CollectionAction = {}) => {
  switch (action.type) {
    case types.START_SEARCH:
      return {
        ...state,
        loading: true,
        searchResults: [],
      };

    case types.SEARCH_FINISHED:
      return {
        ...state,
        loading: false,
        searchResults: action.data && action.data.length > 0
          ? Array.from(new Set(action.data.map((item: MediaRow) => item.id)))
          : [],
      };

    case types.RECEIVE_COLLECTION_ITEM:
    case types.RECEIVE_COLLECTION:
      // REMOVED: All collection data now lives in LiveStore
      // Saga handles LiveStore insert directly before dispatching
      // Components use LiveStore hooks (useFilteredMedia, useMediaMapForIds, etc.)
      // No Redux state update needed
      return state;

    case types.RECEIVE_SETTINGS:
      const enabledProviders = Array.from(
        new Set(
          Object.keys(action.settings!.providers).filter(
            (key) => action.settings!.providers[key].enabled
          )
        )
      );

      return {
        ...state,
        enabledProviders,
      };

    case types.CLEAR_COLLECTION:
      return {
        ...state,
        rows: {},
        artists: {},
        albums: {},
        songsByArtist: {},
        songsByAlbum: {},
        albumsByArtist: {},
        filteredSongs: [],
        searchResults: [],
        totalRows: 0,
        loading: false,
      };

    case types.REMOVE_FROM_COLLECTION_FULFILLED:
      // REMOVED: LiveStore handles removal
      // No Redux state needed - components use LiveStore hooks
      return state;

    case types.UPDATE_MEDIA:
      const media = action.media!;
      return {
        ...state,
        rows: {
          ...state.rows,
          [media.id]: media,
        },
      };

    case types.SET_COLLECTION_FILTER:
      const newFilters = {
        ...state.activeFilters,
        [action.filterType!]: action.filterType === 'favorites'
          ? action.values!.length > 0
          : action.values,
      };

      const filteredSongsSet = new Set(
        applyFilters(state.rows, newFilters, Object.keys(state.rows), action.state)
      );

      return {
        ...state,
        activeFilters: newFilters,
        filteredSongs: Array.from(filteredSongsSet),
      };

    case types.CLEAR_COLLECTION_FILTERS:
      return {
        ...state,
        activeFilters: defaultState.activeFilters,
        filteredSongs: Object.keys(state.rows),
      };

    case types.SET_SEARCH_RESULTS:
      const searchResults = action.searchResults || [];
      return {
        ...state,
        searchResults: Array.from(new Set(searchResults.map((media: MediaRow) => media.id))),
      };

    case types.FETCH_RECENT_ALBUMS_SUCCESS:
      return {
        ...state,
        recentAlbums: action.albums || []
      }

    default:
      return state;
  }
};
