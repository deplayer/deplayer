import * as types from '../constants/ActionTypes'

import filterSongs from '../utils/filter-songs'
import Song from '../entities/Song'

type State = {
  rows: any,
  artists: any,
  albums: any,
  albumsByArtist: any,
  songsByAlbum: any,
  songsByArtist: any,
  searchTerm: string,
  visibleSongs: Array<string>,
  searchResults: Array<string>,
  enabledProviders: Array<string>,
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
  searchTerm: '',
  visibleSongs: [],
  searchResults: [],
  enabledProviders: [],
  loading: true,
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
      const songs = action.data.map((row: any) => {
        return new Song({
          ...row,
          id: row.id,
          forcedId:
          row.id,
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
      songs.forEach((song: Song) => {
        rows[song.id] = song
        artists[song.artist.id] = song.artist
        albums[song.album.id] = song.album

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
      const totalAlbums = {...state.albums, ...albums}
      const totalSongsByArtist  = {...state.songsByArtist, ...songsByArtist}
      const totalAlbumsByArtist  = {...state.albumsByArtist, ...albumsByArtist}
      const totalSongsByAlbum  = {...state.songsByAlbum, ...songsByAlbum}

      return {
        ...state,
        rows: totalRows,
        artists: totalArtists,
        albums: totalAlbums,
        songsByArtist: totalSongsByArtist,
        songsByAlbum: totalSongsByAlbum,
        albumsByArtist: totalAlbumsByArtist,
        visibleSongs: filterSongs(totalRows),
        searchResults: state.searchTerm !== '' ? filterSongs(totalRows, state.searchTerm) : [],
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
