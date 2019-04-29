import * as types from '../constants/ActionTypes'

import filterSongs from '../utils/filter-songs'
import Song from '../entities/Song'

type State = {
  rows: any,
  artists: any,
  albumsByArtist: any,
  songsByAlbum: any,
  songsByArtist: any,
  searchTerm: string,
  visibleSongs: Array<string>,
  searchResults: Array<string>,
  enabledProviders: Array<string>,
  totalRows: number
}

export const defaultState = {
  rows: {},
  artists: {},
  songsByArtist: {},
  songsByAlbum: {},
  albumsByArtist: {},
  searchTerm: '',
  visibleSongs: [],
  searchResults: [],
  enabledProviders: [],
  totalRows: 0
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.SET_SEARCH_TERM: {
      return {
        ...state,
        searchTerm: action.searchTerm
      }
    }

    case types.RECEIVE_COLLECTION: {
      const rows = {}
      const artists = {}
      const songsByArtist = {}
      const albumsByArtist = {}
      const songsByAlbum = {}
      action.data.forEach((row) => {
        const song = new Song(row)
        // if (song.hasAnyProviderOf(state.enabledProviders)) {
        rows[row.id] = song
        artists[song.artist.id] = song.artist

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
      })
      const totalRows = {...state.rows, ...rows}
      const totalArtists = {...state.artists, ...artists}
      const totalSongsByArtist  = {...state.songsByArtist, ...songsByArtist}
      const totalAlbumsByArtist  = {...state.albumsByArtist, ...albumsByArtist}
      const totalSongsByAlbum  = {...state.songsByAlbum, ...songsByAlbum}

      return {
        ...state,
        rows: totalRows,
        artists: totalArtists,
        songsByArtist: totalSongsByArtist,
        songsByAlbum: totalSongsByAlbum,
        albumsByArtist: totalAlbumsByArtist,
        visibleSongs: filterSongs(totalRows),
        searchResults: state.searchTerm !== '' ? filterSongs(totalRows, state.searchTerm) : [],
        totalRows: state.totalRows + action.data.length
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

    case types.SEARCH_FINISHED: {
      return {
        ...state,
        searchResults: state.searchTerm !== '' ? filterSongs(state.rows, state.searchTerm) : []
      }
    }

    default:
      return state
  }
}
