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
  songsByGenre: any,
  mediaByType: any,
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
  songsByGenre: {},
  songsByAlbum: {},
  mediaByType: {
    audio: [],
    video: []
  },
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

const populateFromAction = (state: State, action: {data: any}) => {
  const songs = action.data.map((row: any) => {
    return new Media({
      ...row,
      id: row.id,
      forcedId: row.id,
      artistName: row.artist.name,
      artistId: row.artist.id,
      albumId: row.album.id
    })
  })

  const rows = {}
  const artists = {}
  const albums = {}
  const songsByArtist = {}
  const songsByGenre = {}
  const albumsByArtist = {}
  const songsByAlbum = {}
  const mediaByType = {}
  // FIXME: Convert this in a functional way
  // using map instead of forEach for better performance
  // https://jsperf.com/map-vs-foreach-speed-test
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]

    rows[song.id] = song
    artists[song.artist.id] = song.artist
    albums[song.album.id] = {
      ...song.album,
      albumName: song.albumName,
      thumbnailUrl: song.cover.thumbnailUrl
    }

    if (!songsByArtist[song.artist.id]) {
      songsByArtist[song.artist.id] = []
    }

    songsByArtist[song.artist.id].push(song.id)

    song.genres.forEach((genre: string) => {
      if (!songsByGenre[genre]) {
        songsByGenre[genre] = []
      }

      songsByGenre[genre].push(song.id)
    })

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

    if (!mediaByType[song.type]) {
      mediaByType[song.type] = []
    }

    if (!mediaByType[song.type].includes(song.id)) {
      mediaByType[song.type].push(song.id)
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
    songsByGenre: {...state.songsByGenre, ...songsByGenre},
    songsByAlbum: {...state.songsByAlbum, ...songsByAlbum},
    mediaByType: {...state.mediaByType, ...mediaByType},
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

export const sortByPlayCount = (songId1: string, songId2: string, rows: any) => {
  const song1 = rows[songId1]

  const song2 = rows[songId2]

  if (song1.playCount < song2.playCount) return 1
  if (song1.playCount > song2.playCount) return -1

  return 0
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
      return populateFromAction(state, action)
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
      const songsByNumberOfPlays = Object.keys(state.rows).filter((songId) => {
        return state.rows[songId].playCount > 0
      }).sort((songId1, songId2) => sortByPlayCount(songId1, songId2, state.rows))

      return {
        ...state,
        songsByNumberOfPlays
      }
    }

    case types.REMOVE_FROM_COLLECTION_FULFILLED: {
      const songIds = action.data.map((media: Media) => media.id)

      const newRows = state.rows
      songIds.forEach((songId: string) => {
        delete newRows[songId]
      })

      return populateFromAction(state, { data: Object.values(newRows) })
    }

    case types.UPDATE_MEDIA: {
      const media = action.media

      state.rows[media.id] = media

      return {
        ...state,
        rows: state.rows
      }
    }

    case types.SET_CACHED_DATA: {
      return action.data.collection
    }

    default:
      return state
  }
}
