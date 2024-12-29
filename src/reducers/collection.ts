import Media from "../entities/Media";
import filterSongs from "../utils/filter-songs";
import * as types from "../constants/ActionTypes";
import IndexService from "../services/Search/IndexService";
import Artist from "../entities/Artist";
import IMedia from "../entities/Media";
import { applyFilters } from "../utils/apply-filters";

const indexService = IndexService();

export type Filter = {
  genres: string[];
  types: string[];
  artists: string[];
  providers: string[];
};

export type State = {
  rows: { [key: string]: IMedia };
  albums: { [key: string]: any };
  artists: { [key: string]: Artist };
  songsByArtist: { [key: string]: string[] };
  songsByGenre: { [key: string]: string[] };
  albumsByArtist: { [key: string]: string[] };
  songsByAlbum: { [key: string]: string[] };
  mediaByType: { [key: string]: string[] };
  songsByNumberOfPlays: string[];
  searchTerm: string;
  searchResults: string[];
  enabledProviders: string[];
  searchIndex: object | null;
  loading: boolean;
  totalRows: number;
  activeFilters: Filter;
  filteredSongs: string[];
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
  songsByNumberOfPlays: [],
  searchTerm: "",
  searchResults: [],
  enabledProviders: [],
  searchIndex: null,
  loading: true,
  totalRows: 0,
  activeFilters: {
    genres: [],
    types: [],
    artists: [],
    providers: [],
  },
  filteredSongs: [],
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
        // Deduplicate genres
        const uniqueGenres = [...new Set(songDocument.genres || [])];
        const processedSong = {
          ...songDocument,
          genres: uniqueGenres,
        } as IMedia;

        // Add to main collections
        acc.rows[processedSong.id] = processedSong;
        acc.albums[processedSong.album.id] = processedSong.album;
        acc.artists[processedSong.artist.id] = processedSong.artist;

        // Initialize arrays if they don't exist
        acc.songsByArtist[processedSong.artist.id] =
          acc.songsByArtist[processedSong.artist.id] || [];
        acc.albumsByArtist[processedSong.artist.id] =
          acc.albumsByArtist[processedSong.artist.id] || [];
        acc.songsByAlbum[processedSong.album.id] =
          acc.songsByAlbum[processedSong.album.id] || [];

        // Add song to artist's songs if not already present
        if (
          !acc.songsByArtist[processedSong.artist.id].includes(processedSong.id)
        ) {
          acc.songsByArtist[processedSong.artist.id].push(processedSong.id);
        }

        // Add album to artist's albums if not already present
        if (
          !acc.albumsByArtist[processedSong.artist.id].includes(
            processedSong.album.id
          )
        ) {
          acc.albumsByArtist[processedSong.artist.id].push(
            processedSong.album.id
          );
        }

        // Add song to album's songs if not already present
        if (
          !acc.songsByAlbum[processedSong.album.id].includes(processedSong.id)
        ) {
          acc.songsByAlbum[processedSong.album.id].push(processedSong.id);
        }

        // Handle genres
        uniqueGenres.forEach((genre) => {
          acc.songsByGenre[genre] = acc.songsByGenre[genre] || [];
          if (!acc.songsByGenre[genre].includes(processedSong.id)) {
            acc.songsByGenre[genre].push(processedSong.id);
          }
        });

        // Handle media type
        acc.mediaByType[processedSong.type] =
          acc.mediaByType[processedSong.type] || [];
        if (!acc.mediaByType[processedSong.type].includes(processedSong.id)) {
          acc.mediaByType[processedSong.type].push(processedSong.id);
        }

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
      }
    );

  const searchResults = filterSongs(
    indexService,
    aggregation.rows,
    state.searchTerm
  );
  const filteredSongs = applyFilters(aggregation.rows, state.activeFilters);

  return {
    ...aggregation,
    searchResults,
    filteredSongs,
    totalRows: Object.keys(aggregation.rows).length,
    loading: false,
  };
};

export const sortByPlayCount = (
  songId1: string,
  songId2: string,
  rows: any
) => {
  const song1 = rows[songId1];

  const song2 = rows[songId2];

  if (song1.playCount < song2.playCount) return 1;
  if (song1.playCount > song2.playCount) return -1;

  return 0;
};

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.SET_SEARCH_TERM: {
      return {
        ...state,
        searchTerm: action.searchTerm,
      };
    }

    case types.START_SEARCH:
    case types.SEARCH_FINISHED: {
      return {
        ...state,
        searchResults:
          state.searchTerm !== ""
            ? filterSongs(indexService, state.rows, state.searchTerm)
            : [],
      };
    }

    case types.RECEIVE_SEARCH_INDEX: {
      return {
        ...state,
        searchIndex: action.data,
        searchResults:
          state.searchTerm !== ""
            ? filterSongs(indexService, state.rows, state.searchTerm)
            : [],
      };
    }

    case types.RECEIVE_COLLECTION_ITEM:
    case types.RECEIVE_COLLECTION: {
      return populateFromAction(state, action);
    }

    case types.RECEIVE_SETTINGS: {
      const enabledProviders = Object.keys(action.settings.providers).filter(
        (key) => {
          return action.settings.providers[key].enabled;
        }
      );

      return {
        ...state,
        enabledProviders,
      };
    }

    case types.CLEAR_COLLECTION: {
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
    }

    case types.APPLY_MOST_PLAYED_SORT: {
      const songsByNumberOfPlays = Object.keys(state.rows)
        .filter((songId) => {
          return state.rows[songId].playCount > 0;
        })
        .sort((songId1, songId2) =>
          sortByPlayCount(songId1, songId2, state.rows)
        );

      return {
        ...state,
        songsByNumberOfPlays,
      };
    }

    case types.REMOVE_FROM_COLLECTION_FULFILLED: {
      const songIds = action.data.map((media: Media) => media.id);

      const newRows = state.rows;
      songIds.forEach((songId: string) => {
        delete newRows[songId];
      });

      return populateFromAction(state, { data: Object.values(newRows) });
    }

    case types.UPDATE_MEDIA: {
      const media = action.media;

      return { ...state, [media.id]: media };
    }

    case types.SET_COLLECTION_FILTER: {
      const newFilters = {
        ...state.activeFilters,
        [action.filterType]: action.values,
      };

      const filteredSongs = applyFilters(
        state.rows,
        newFilters,
        Object.keys(state.rows)
      );

      return {
        ...state,
        activeFilters: newFilters,
        filteredSongs,
      };
    }

    case types.CLEAR_COLLECTION_FILTERS: {
      return {
        ...state,
        activeFilters: defaultState.activeFilters,
        filteredSongs: Object.keys(state.rows),
      };
    }

    default:
      return state;
  }
};
