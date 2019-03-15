import * as types from '../constants/ActionTypes'

import IndexService from '../services/Search/IndexService'
import Song from '../entities/Song'

type State = {
  error: string,
  searchTerm: string,
  loading: boolean,
  searchIndex: object,
  visibleSongs: Array<string>,
  searchToggled: boolean
}

export const defaultState = {
  error: '',
  searchTerm: '',
  loading: false,
  searchIndex: {},
  visibleSongs: [],
  searchToggled: false
}

const getKeys = (rows: any): Array<string> => {
  return Object.keys(rows)
}

export const filterSongs = (songs: any, term: string) => {
  if (!term || term === '') {
    return Object.keys(songs)
  }

  const songsArray = getKeys(songs).map((key) => {
    return songs[key]
  })

  // TODO: Save, cache and load index from db
  const indexService = new IndexService()
  const results = indexService
    .generateIndexFrom(songsArray)
    .search(term)

  const mappedResults = results.map((result) => {
    return result.ref
  })

  return mappedResults
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.SET_SEARCH_TERM: {
      return {
        ...state,
        searchTerm: action.searchTerm
      }
    }

    case types.RECEIVE_SEARCH_INDEX: {
      return {
        ...state,
        searchIndex: action.data
      }
    }

    case types.TOGGLE_SEARCH: {
      return {
        ...state,
        searchToggled: !state.searchToggled
      }
    }

    case types.START_SEARCH: {
      return {
        ...state,
        searchTerm: action.searchTerm,
        loading: true
      }
    }

    case types.SEARCH_REJECTED: {
      return {
        ...state,
        error: action.message,
        loading: false
      }
    }

    case types.SEARCH_FULLFILLED: {
      return {
        ...state,
        error: '',
        loading: false
      }
    }

    case types.ADD_TO_COLLECTION:
    case types.RECEIVE_COLLECTION: {
      const rows = {}
      action.data.forEach((row) => {
        rows[row.id] = new Song(row)
      })
      return {
        ...state,
        visibleSongs: filterSongs(rows, state.searchTerm)
      }
    }

    default:
      return state
  }
}
