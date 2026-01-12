import * as types from "../constants/ActionTypes";
import Artist from "../entities/Artist";
import IMedia from "../entities/Media";
import { applyFilters } from "../utils/apply-filters";
import type { Filter } from "../types/collection";

// Re-export Filter type for backward compatibility
export type { Filter };

export type State = {
  rows: { [key: string]: IMedia };
  albums: { [key: string]: any };
  artists: { [key: string]: Artist };
  songsByArtist: { [key: string]: string[] };
  songsByGenre: { [key: string]: string[] };
  albumsByArtist: { [key: string]: string[] };
  songsByAlbum: { [key: string]: string[] };
  mediaByType: { [key: string]: string[] };
  searchTerm: string;
  searchResults: string[];
  enabledProviders: string[];
  loading: boolean;
  totalRows: number;
  activeFilters: Filter;
  filteredSongs: string[];
  recentAlbums: IMedia[];
};

export const defaultState: State = {
  rows: {},
  albums: {},
  artists: {},
  songsByArtist: {},
  songsByGenre: {},
  songsByAlbum: {},
  mediaByType: {},
  albumsByArtist: {},
  searchTerm: "",
  searchResults: [],
  enabledProviders: [],
  loading: true,
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

const populateFromAction = (
  state: State,
  action: { data: IMedia[] }
): State => {
  const aggregation = action.data
    .sort((a: IMedia, b: IMedia) => {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    })
    .reduce(
      (acc: State, songDocument: IMedia) => {
        // Use Set for genre deduplication
        const uniqueGenres = Array.from(new Set(songDocument.genres || []));
        const processedSong = {
          ...songDocument,
          genres: uniqueGenres,
        } as IMedia;

        // Add to main collections
        acc.rows[processedSong.id] = processedSong;
        acc.albums[processedSong.album.id] = processedSong.album;
        acc.artists[processedSong.artist.id] = processedSong.artist;

        // Use Sets for efficient tracking of songs and albums
        const artistSongsSet = new Set(acc.songsByArtist[processedSong.artist.id] || []);
        const artistAlbumsSet = new Set(acc.albumsByArtist[processedSong.artist.id] || []);
        const albumSongsSet = new Set(acc.songsByAlbum[processedSong.album.id] || []);

        // Add items to Sets (automatic deduplication)
        artistSongsSet.add(processedSong.id);
        artistAlbumsSet.add(processedSong.album.id);
        albumSongsSet.add(processedSong.id);

        // Convert Sets back to arrays for Redux state
        acc.songsByArtist[processedSong.artist.id] = Array.from(artistSongsSet);
        acc.albumsByArtist[processedSong.artist.id] = Array.from(artistAlbumsSet);
        acc.songsByAlbum[processedSong.album.id] = Array.from(albumSongsSet);

        // Handle genres with Sets
        uniqueGenres.forEach((genre) => {
          const genreSongsSet = new Set(acc.songsByGenre[genre] || []);
          genreSongsSet.add(processedSong.id);
          acc.songsByGenre[genre] = Array.from(genreSongsSet);
        });

        // Handle media type with Sets
        const mediaTypeSet = new Set(acc.mediaByType[processedSong.type] || []);
        mediaTypeSet.add(processedSong.id);
        acc.mediaByType[processedSong.type] = Array.from(mediaTypeSet);

        return acc;
      },
      {
        ...defaultState,
        rows: { ...state.rows },
        albums: { ...state.albums },
        artists: { ...state.artists },
        songsByArtist: { ...state.songsByArtist },
        songsByGenre: { ...state.songsByGenre },
        albumsByArtist: { ...state.albumsByArtist },
        songsByAlbum: { ...state.songsByAlbum },
        mediaByType: { ...state.mediaByType },
        enabledProviders: [...state.enabledProviders],
      }
    );

  // Use Set for filtered songs deduplication
  const filteredSongsSet = new Set(applyFilters(aggregation.rows, state.activeFilters));

  return {
    ...aggregation,
    searchResults: state.searchResults, // Keep existing search results
    filteredSongs: Array.from(filteredSongsSet),
    totalRows: Object.keys(aggregation.rows).length,
    loading: false,
  };
};

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.SET_SEARCH_TERM:
      return {
        ...state,
        searchTerm: action.searchTerm,
      };

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
        searchResults: action.data
          ? Array.from(new Set(action.data.map((item: IMedia) => item.id)))
          : [],
      };

    case types.RECEIVE_COLLECTION_ITEM:
    case types.RECEIVE_COLLECTION:
      return populateFromAction(state, action);

    case types.RECEIVE_SETTINGS:
      const enabledProviders = Array.from(
        new Set(
          Object.keys(action.settings.providers).filter(
            (key) => action.settings.providers[key].enabled
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
      const songIds = new Set<string>(action.data.map((media: IMedia) => media.id));
      const newRows = { ...state.rows };
      songIds.forEach((songId: string) => {
        delete newRows[songId];
      });
      return populateFromAction(state, { data: Object.values(newRows) });

    case types.UPDATE_MEDIA:
      const media = action.media;
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
        [action.filterType]: action.filterType === 'favorites' 
          ? action.values.length > 0 
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
        searchResults: Array.from(new Set(searchResults.map((media: IMedia) => media.id))),
      };

    case types.FETCH_RECENT_ALBUMS_SUCCESS:
      return {
        ...state,
        recentAlbums: action.albums
      }

    default:
      return state;
  }
};
