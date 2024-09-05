import Media from "../entities/Media";
import filterSongs from "../utils/filter-songs";
import * as types from "../constants/ActionTypes";
import IndexService from "../services/Search/IndexService";
import Artist from "../entities/Artist"
import merge from "deepmerge"

const indexService = IndexService();

export type State = {
  rows: { [key: string]: any };
  artists: { [key: string]: Artist };
  albums: { [key: string]: any };
  albumsByArtist: any;
  songsByAlbum: any;
  songsByNumberOfPlays: Array<string>;
  songsByArtist: any;
  songsByGenre: any;
  mediaByType: any;
  searchTerm: string;
  visibleSongs: Array<string>;
  searchResults: Array<string>;
  enabledProviders: Array<string>;
  searchIndex: object | null;
  loading: boolean;
  totalRows: number;
};

export const defaultState = {
  rows: {},
  artists: {},
  albums: {},
  songsByArtist: {},
  songsByGenre: {},
  songsByAlbum: {},
  mediaByType: {
    audio: [],
    video: [],
  },
  albumsByArtist: {},
  songsByNumberOfPlays: [],
  searchTerm: "",
  visibleSongs: [],
  searchResults: [],
  enabledProviders: [],
  searchIndex: null,
  loading: true,
  totalRows: 0,
};

const populateFromAction = (state: State, action: { data: any }): State => {
  const aggregation = action.data
    .sort((a: any, b: any) => {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    })
    .reduce(
      (acc: any, row: any) => {
        const song = new Media({
          ...row,
          id: row.id,
          forcedId: row.id,
          artistName: row.artist.name,
          artistId: row.artist.id,
          albumId: row.album.id,
        });

        const songDocument = song.toDocument();

        acc.rows[song.id] = songDocument
        acc.albums[song.album.id] = songDocument.album
        acc.artists[song.artist.id] = songDocument.artist

        // Ensure initialization of arrays/maps
        acc.songsByArtist[songDocument.artist.id] =
          acc.songsByArtist[songDocument.artist.id] || [];
        acc.songsByGenre = song.genres.reduce((genresAcc, genre) => {
          genresAcc[genre] = genresAcc[genre] || [];
          genresAcc[genre].push(song.id);
          return genresAcc;
        }, acc.songsByGenre);
        acc.albumsByArtist[songDocument.artist.id] =
          acc.albumsByArtist[songDocument.artist.id] || [];
        acc.songsByAlbum[songDocument.album.id] = acc.songsByAlbum[songDocument.album.id] || [];
        acc.mediaByType[songDocument.media_type] = acc.mediaByType[songDocument.type] || [];

        // Add song ID to relevant arrays if not already present
        if (!acc.songsByArtist[songDocument.artist.id].includes(songDocument.id)) {
          acc.songsByArtist[songDocument.artist.id].push(songDocument.id);
        }
        if (!acc.albumsByArtist[songDocument.artist.id].includes(songDocument.album.id)) {
          acc.albumsByArtist[songDocument.artist.id].push(songDocument.album.id);
        }
        if (!acc.songsByAlbum[songDocument.album.id].includes(songDocument.id)) {
          acc.songsByAlbum[songDocument.album.id].push(songDocument.id);
        }
        if (!acc.mediaByType[songDocument.media_type].includes(songDocument.id)) {
          acc.mediaByType[songDocument.media_type].push(songDocument.id);
        }

        return acc;
      },
      {
        rows: {},
        albums: {},
        artists: {},
        songsByArtist: {},
        songsByGenre: {},
        albumsByArtist: {},
        songsByAlbum: {},
        mediaByType: {},
      }
    );

  const overwriteMerge = (_destinationArray: [], sourceArray: [], _options: any) => sourceArray
  const rows = merge(state.rows, aggregation.rows, { arrayMerge: overwriteMerge })

  // Merge the aggregated data with the existing state
  return {
    ...state,
    rows: rows,
    artists: { ...state.artists, ...aggregation.artists },
    albums: { ...state.albums, ...aggregation.albums },
    songsByArtist: { ...state.songsByArtist, ...aggregation.songsByArtist },
    songsByGenre: { ...state.songsByGenre, ...aggregation.songsByGenre },
    albumsByArtist: { ...state.albumsByArtist, ...aggregation.albumsByArtist },
    songsByAlbum: { ...state.songsByAlbum, ...aggregation.songsByAlbum },
    mediaByType: { ...state.mediaByType, ...aggregation.mediaByType },
    visibleSongs: filterSongs(indexService, rows, state.searchTerm),
    loading: false,
    totalRows: Object.keys(rows).length,
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
        visibleSongs: [],
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

      return { ...state, [media.id]: media }
    }

    default:
      return state;
  }
};
