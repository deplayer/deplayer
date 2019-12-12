import Media from '../entities/Media'
import filterSongs from '../utils/filter-songs'
import * as types from '../constants/ActionTypes'
import IndexService from '../services/Search/IndexService'

type State = {
  rows: { [key: string]: Media },
  artists: any,
  albums: any,
  albumsByArtist: any,
  songsByAlbum: any,
  songsByNumberOfPlays: Array<string>,
  songsByArtist: any,
  searchTerm: string,
  visibleSongs: Array<string>,
  searchResults: Array<string>,
  enabledProviders: Array<string>,
  searchIndex: object | null,
  loading: boolean,
  totalRows: number
}

export const defaultState = {
  rows: {},
  artists: {},
  albums: {},
  songsByArtist: {},
  songsByAlbum: {},
  albumsByArtist: {},
  songsByNumberOfPlays: [],
  searchTerm: '',
  visibleSongs: [],
  searchResults: [],
  enabledProviders: [],
  searchIndex: null,
  loading: true,
  totalRows: 0
}

const getIndexService = (index: any) => {
  const indexService = new IndexService()
  if (!index) {
    return indexService
  }

  return indexService.loadIndex(index.index)
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.SET_SEARCH_TERM: {
      return {
        ...state,
        searchTerm: action.searchTerm
      }
    }

    case types.START_SEARCH:
    case types.SEARCH_FINISHED:  {
      const indexService = getIndexService(state.searchIndex)
      return {
        ...state,
        searchResults: state.searchTerm !== '' ? filterSongs(indexService, state.rows, state.searchTerm) : []
      }
    }

    case types.RECEIVE_SEARCH_INDEX: {
      const indexService = getIndexService(action.data)
      return {
        ...state,
        searchIndex: action.data,
        searchResults: state.searchTerm !== '' ? filterSongs(indexService, state.rows, state.searchTerm) : []
      }
    }

    case types.RECEIVE_COLLECTION_ITEM:
    case types.RECEIVE_COLLECTION: {
      const songs = action.data.map((row: any) => {
        return new Media({
          ...row,
          id: row.id,
          forcedId: row.id,
          artistId: row.artist.id,
          albumId: row.album.id
        })
      })

      const rows = {}
      const artists = {}
      const albums = {}
      const songsByArtist = {}
      const albumsByArtist = {}
      const songsByAlbum = {}
      // FIXME: Convert this in a functional way
      // using map instead of forEach for better performance
      // https://jsperf.com/map-vs-foreach-speed-test
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i]
        rows[song.id] = song
        artists[song.artist.id] = song.artist
        albums[song.album.id] = {
          ...song.album,
          thumbnailUrl: song.cover.thumbnailUrl
        }

        if (!songsByArtist[song.artist.id]) {
          songsByArtist[song.artist.id] = []
        }

        songsByArtist[song.artist.id].push(song.id)

        if (!albumsByArtist[song.artist.id]) {
          albumsByArtist[song.artist.id] = []
        }

        if (!albumsByArtist[song.artist.id].includes(song.album.id)) {
          albumsByArtist[song.artist.id].push(song.album.id)
        }

        if (!songsByAlbum[song.album.id]) {
          songsByAlbum[song.album.id] = []
        }

        if (!songsByAlbum[song.album.id].includes(song.id)) {
          songsByAlbum[song.album.id].push(song.id)
        }
      }

      const totalRows = {...state.rows, ...rows}
      const indexService = getIndexService(state.searchIndex)

      return {
        ...state,
        rows: totalRows,
        artists: {...state.artists, ...artists},
        albums: {...state.albums, ...albums},
        songsByArtist: {...state.songsByArtist, ...songsByArtist},
        songsByAlbum: {...state.songsByAlbum, ...songsByAlbum},
        albumsByArtist: {...state.albumsByArtist, ...albumsByArtist},
        visibleSongs: filterSongs(
          indexService,
          totalRows
        ),
        searchResults: state.searchTerm !== '' ? filterSongs(indexService, totalRows, state.searchTerm) : [],
        totalRows: Object.keys(totalRows).length,
        loading: false
      }
    }

    case types.RECEIVE_SETTINGS: {
      const enabledProviders = Object.keys(action.settings.providers).filter((key) => {
        return action.settings.providers[key].enabled
      })

      return {
        ...state,
        enabledProviders
      }
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
        loading: false
      }
    }

    case types.APPLY_MOST_PLAYED_SORT: {
      const songsByNumberOfPlays = Object.keys(state.rows).sort((songId1, songId2) => {
        const song1 = state.rows[songId1]
        const song2 = state.rows[songId2]

        if (song1.playCount > song2.playCount) return 1
        if (song1.playCount < song2.playCount) return -1

        return 0
      }).filter((songId) => {
        return state.rows[songId].playCount > 0
      })

      return {
        ...state,
        songsByNumberOfPlays
      }
    }

    default:
      return state
  }
}
