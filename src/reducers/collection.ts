import * as types from '../constants/ActionTypes'

import filterSongs from '../utils/filter-songs'
import Song from '../entities/Song'

type State = {
  rows: any,
  artists: any,
  searchTerm: string,
  visibleSongs: Array<string>,
  searchResults: Array<string>,
  enabledProviders: Array<string>,
  totalRows: number
}

export const defaultState = {
  rows: {},
  artists: {},
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

    case types.ADD_TO_COLLECTION:
    case types.RECEIVE_COLLECTION: {
      const rows = {}
      const artists = {}
      action.data.forEach((row) => {
        const song = new Song(row)
        if (song.hasAnyProviderOf(state.enabledProviders)) {
          rows[row.id] = song
          artists[song.artist.id] = song.artist
        }
      })
      const totalRows = {...state.rows, ...rows}
      const totalArtists = {...state.artists, ...artists}
      return {
        ...state,
        rows: totalRows,
        artists: totalArtists,
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

    default:
      return state
  }
}
